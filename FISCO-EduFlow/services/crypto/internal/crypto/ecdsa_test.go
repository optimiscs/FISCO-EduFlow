package crypto

import (
	"encoding/hex"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestECDSAService_GenerateKeyPair(t *testing.T) {
	service := NewECDSAService()

	privateKey, err := service.GenerateKeyPair()
	require.NoError(t, err)
	require.NotNil(t, privateKey)
	require.NotNil(t, privateKey.PublicKey)

	// 验证私钥有效性
	err = service.ValidatePrivateKey(privateKey)
	assert.NoError(t, err)

	// 验证公钥有效性
	err = service.ValidatePublicKey(&privateKey.PublicKey)
	assert.NoError(t, err)
}

func TestECDSAService_KeyConversion(t *testing.T) {
	service := NewECDSAService()

	// 生成密钥对
	originalPrivateKey, err := service.GenerateKeyPair()
	require.NoError(t, err)

	// 转换为十六进制
	privateKeyHex := service.PrivateKeyToHex(originalPrivateKey)
	publicKeyHex := service.PublicKeyToHex(&originalPrivateKey.PublicKey)

	// 验证十六进制格式
	assert.Equal(t, 64, len(privateKeyHex)) // 32字节 = 64个十六进制字符
	assert.Equal(t, 130, len(publicKeyHex)) // 65字节 = 130个十六进制字符

	// 从十六进制恢复
	recoveredPrivateKey, err := service.HexToPrivateKey(privateKeyHex)
	require.NoError(t, err)

	recoveredPublicKey, err := service.HexToPublicKey(publicKeyHex)
	require.NoError(t, err)

	// 验证恢复的密钥与原始密钥相同
	assert.Equal(t, originalPrivateKey.D, recoveredPrivateKey.D)
	assert.Equal(t, originalPrivateKey.PublicKey.X, recoveredPublicKey.X)
	assert.Equal(t, originalPrivateKey.PublicKey.Y, recoveredPublicKey.Y)
}

func TestECDSAService_SignAndVerify(t *testing.T) {
	service := NewECDSAService()

	// 生成密钥对
	privateKey, err := service.GenerateKeyPair()
	require.NoError(t, err)

	// 测试数据
	testData := []byte("Hello, Blockchain Education Platform!")

	// 签名
	signature, err := service.Sign(privateKey, testData)
	require.NoError(t, err)
	require.NotNil(t, signature)
	assert.Equal(t, 65, len(signature)) // ECDSA签名长度应为65字节

	// 验证签名
	valid := service.Verify(&privateKey.PublicKey, testData, signature)
	assert.True(t, valid)

	// 验证错误的数据
	wrongData := []byte("Wrong data")
	valid = service.Verify(&privateKey.PublicKey, wrongData, signature)
	assert.False(t, valid)

	// 验证错误的签名
	wrongSignature := make([]byte, 65)
	copy(wrongSignature, signature)
	wrongSignature[0] ^= 0xFF // 修改第一个字节
	valid = service.Verify(&privateKey.PublicKey, testData, wrongSignature)
	assert.False(t, valid)
}

func TestECDSAService_RecoverPublicKey(t *testing.T) {
	service := NewECDSAService()

	// 生成密钥对
	privateKey, err := service.GenerateKeyPair()
	require.NoError(t, err)

	// 测试数据
	testData := []byte("Recovery test data")

	// 签名
	signature, err := service.Sign(privateKey, testData)
	require.NoError(t, err)

	// 从签名恢复公钥
	recoveredPublicKey, err := service.RecoverPublicKey(testData, signature)
	require.NoError(t, err)

	// 验证恢复的公钥与原始公钥相同
	assert.Equal(t, privateKey.PublicKey.X, recoveredPublicKey.X)
	assert.Equal(t, privateKey.PublicKey.Y, recoveredPublicKey.Y)
}

func TestECDSAService_SignatureRSV(t *testing.T) {
	service := NewECDSAService()

	// 生成密钥对
	privateKey, err := service.GenerateKeyPair()
	require.NoError(t, err)

	// 测试数据
	testData := []byte("RSV test data")

	// 签名
	signature, err := service.Sign(privateKey, testData)
	require.NoError(t, err)

	// 提取R、S、V组件
	r, s, v, err := service.SignatureToRSV(signature)
	require.NoError(t, err)
	require.NotNil(t, r)
	require.NotNil(t, s)

	// 重构签名
	reconstructedSignature := service.RSVToSignature(r, s, v)
	assert.Equal(t, signature, reconstructedSignature)

	// 验证重构的签名
	valid := service.Verify(&privateKey.PublicKey, testData, reconstructedSignature)
	assert.True(t, valid)
}

func TestECDSAService_GetAddress(t *testing.T) {
	service := NewECDSAService()

	// 生成密钥对
	privateKey, err := service.GenerateKeyPair()
	require.NoError(t, err)

	// 获取地址
	address := service.GetAddress(&privateKey.PublicKey)

	// 验证地址格式
	assert.Equal(t, 42, len(address)) // 以太坊地址长度为42字符（包括0x前缀）
	assert.True(t, address[:2] == "0x")

	// 验证地址是有效的十六进制
	_, err = hex.DecodeString(address[2:])
	assert.NoError(t, err)
}

func TestECDSAService_ValidateKeys(t *testing.T) {
	service := NewECDSAService()

	// 测试有效密钥
	privateKey, err := service.GenerateKeyPair()
	require.NoError(t, err)

	err = service.ValidatePrivateKey(privateKey)
	assert.NoError(t, err)

	err = service.ValidatePublicKey(&privateKey.PublicKey)
	assert.NoError(t, err)

	// 测试nil私钥
	err = service.ValidatePrivateKey(nil)
	assert.Error(t, err)

	// 测试nil公钥
	err = service.ValidatePublicKey(nil)
	assert.Error(t, err)
}
