package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/blockchain-education-platform/state-channels/internal/types"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Hub WebSocket连接中心
type Hub struct {
	clients    map[*Client]bool
	channels   map[string]map[*Client]bool // channelID -> clients
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

// Client WebSocket客户端
type Client struct {
	hub        *Hub
	conn       *websocket.Conn
	send       chan []byte
	userID     string
	channels   map[string]bool // 客户端订阅的通道
	lastPing   time.Time
}

// NewHub 创建新的WebSocket中心
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		channels:   make(map[string]map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run 运行WebSocket中心
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("Client %s connected", client.userID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)

				// 从所有通道中移除客户端
				for channelID := range client.channels {
					if clients, exists := h.channels[channelID]; exists {
						delete(clients, client)
						if len(clients) == 0 {
							delete(h.channels, channelID)
						}
					}
				}
			}
			h.mu.Unlock()
			log.Printf("Client %s disconnected", client.userID)

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastToChannel 向特定通道广播消息
func (h *Hub) BroadcastToChannel(channelID string, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, exists := h.channels[channelID]; exists {
		for client := range clients {
			select {
			case client.send <- message:
			default:
				close(client.send)
				delete(h.clients, client)
				delete(clients, client)
			}
		}
	}
}

// SubscribeToChannel 订阅通道
func (h *Hub) SubscribeToChannel(client *Client, channelID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.channels[channelID] == nil {
		h.channels[channelID] = make(map[*Client]bool)
	}

	h.channels[channelID][client] = true
	client.channels[channelID] = true

	log.Printf("Client %s subscribed to channel %s", client.userID, channelID)
}

// UnsubscribeFromChannel 取消订阅通道
func (h *Hub) UnsubscribeFromChannel(client *Client, channelID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, exists := h.channels[channelID]; exists {
		delete(clients, client)
		if len(clients) == 0 {
			delete(h.channels, channelID)
		}
	}

	delete(client.channels, channelID)

	log.Printf("Client %s unsubscribed from channel %s", client.userID, channelID)
}

// GetConnectionCount 获取连接数
func (h *Hub) GetConnectionCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// GetChannelSubscribers 获取通道订阅者数量
func (h *Hub) GetChannelSubscribers(channelID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, exists := h.channels[channelID]; exists {
		return len(clients)
	}
	return 0
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 允许所有来源，生产环境应该更严格
	},
}

// HandleWebSocket 处理WebSocket连接
func (h *Hub) HandleWebSocket(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	client := &Client{
		hub:      h,
		conn:     conn,
		send:     make(chan []byte, 256),
		userID:   userID,
		channels: make(map[string]bool),
		lastPing: time.Now(),
	}

	h.register <- client

	// 启动读写协程
	go client.writePump()
	go client.readPump()
}

const (
	// 写入等待时间
	writeWait = 10 * time.Second

	// Pong等待时间
	pongWait = 60 * time.Second

	// Ping周期，必须小于pongWait
	pingPeriod = (pongWait * 9) / 10

	// 最大消息大小
	maxMessageSize = 512
)

// readPump 读取消息
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		c.lastPing = time.Now()
		return nil
	})

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// 解析消息
		var wsMessage types.WebSocketMessage
		if err := json.Unmarshal(messageBytes, &wsMessage); err != nil {
			log.Printf("Failed to parse WebSocket message: %v", err)
			continue
		}

		// 处理消息
		c.handleMessage(wsMessage)
	}
}

// writePump 写入消息
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// 添加队列中的其他消息
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage 处理WebSocket消息
func (c *Client) handleMessage(message types.WebSocketMessage) {
	switch message.Type {
	case "subscribe":
		if channelID, ok := message.Data.(string); ok {
			c.hub.SubscribeToChannel(c, channelID)
			c.sendResponse("subscribed", map[string]interface{}{
				"channel_id": channelID,
			})
		}

	case "unsubscribe":
		if channelID, ok := message.Data.(string); ok {
			c.hub.UnsubscribeFromChannel(c, channelID)
			c.sendResponse("unsubscribed", map[string]interface{}{
				"channel_id": channelID,
			})
		}

	case "ping":
		c.sendResponse("pong", map[string]interface{}{
			"timestamp": time.Now(),
		})

	case "get_subscriptions":
		subscriptions := make([]string, 0, len(c.channels))
		for channelID := range c.channels {
			subscriptions = append(subscriptions, channelID)
		}
		c.sendResponse("subscriptions", map[string]interface{}{
			"channels": subscriptions,
		})

	default:
		c.sendError("unknown_message_type", "Unknown message type: "+message.Type)
	}
}

// sendResponse 发送响应
func (c *Client) sendResponse(msgType string, data interface{}) {
	response := types.WebSocketMessage{
		Type:      msgType,
		Data:      data,
		Timestamp: time.Now(),
	}

	messageBytes, err := json.Marshal(response)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		return
	}

	select {
	case c.send <- messageBytes:
	default:
		close(c.send)
	}
}

// sendError 发送错误消息
func (c *Client) sendError(errorType, message string) {
	c.sendResponse("error", map[string]interface{}{
		"type":    errorType,
		"message": message,
	})
}

// SendChannelEvent 发送通道事件
func (h *Hub) SendChannelEvent(channelID string, event types.ChannelEvent) {
	message := types.WebSocketMessage{
		Type:      "channel_event",
		ChannelID: channelID,
		Data:      event,
		Timestamp: time.Now(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal channel event: %v", err)
		return
	}

	h.BroadcastToChannel(channelID, messageBytes)
}

// SendChannelMessage 发送通道消息
func (h *Hub) SendChannelMessage(channelID string, msg types.Message) {
	message := types.WebSocketMessage{
		Type:      "channel_message",
		ChannelID: channelID,
		Data:      msg,
		Timestamp: time.Now(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal channel message: %v", err)
		return
	}

	h.BroadcastToChannel(channelID, messageBytes)
}

// SendNotification 发送通知
func (h *Hub) SendNotification(userID string, notification types.NotificationData) {
	message := types.WebSocketMessage{
		Type:      "notification",
		Data:      notification,
		Timestamp: time.Now(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal notification: %v", err)
		return
	}

	// 发送给特定用户
	h.mu.RLock()
	for client := range h.clients {
		if client.userID == userID {
			select {
			case client.send <- messageBytes:
			default:
				close(client.send)
				delete(h.clients, client)
			}
		}
	}
	h.mu.RUnlock()
}
