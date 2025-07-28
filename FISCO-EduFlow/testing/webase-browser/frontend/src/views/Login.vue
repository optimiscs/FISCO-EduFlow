<!-- Login.vue - 管理员登录页面
功能：提供管理员账号密码登录界面，校验后跳转到仪表盘。
主要职责：
1. 输入账号和密码
2. 调用后端API校验
3. 登录成功跳转，失败提示
4. 记住我、密码可见切换、回车登录、表单重置
技术栈：Vue3, ElementPlus, Axios
-->
<template>
  <el-row
    justify="center"
    align="middle"
    style="
      height: 100vh;
      background: linear-gradient(135deg, #e0e7ff 0%, #fff 100%);
    "
  >
    <el-col :span="8">
      <el-card shadow="hover" style="border-radius: 12px">
        <h2 style="text-align: center">管理员登录</h2>
        <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          label-width="80px"
          @keyup.enter="onLogin"
        >
          <el-form-item label="账号" prop="username">
            <el-input
              v-model="form.username"
              autocomplete="username"
              clearable
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              autocomplete="current-password"
            >
              <template #suffix>
                <el-icon @click="showPwd = !showPwd" style="cursor: pointer">
                  <component :is="showPwd ? 'View' : 'Hide'" />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="form.remember">记住我</el-checkbox>
            <el-button type="info" @click="onReset" style="float: right"
              >重置</el-button
            >
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              @click="onLogin"
              :loading="loading"
              style="width: 100%"
              >登录</el-button
            >
          </el-form-item>
          <el-alert
            v-if="error"
            :title="error"
            type="error"
            show-icon
            style="margin-top: 10px"
          />
        </el-form>
      </el-card>
    </el-col>
  </el-row>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { View, Hide } from "@element-plus/icons-vue";
const router = useRouter();
const form = ref({ username: "", password: "", remember: false });
const rules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};
const formRef = ref();
const loading = ref(false);
const error = ref("");
const showPwd = ref(false);
const onLogin = () => {
  error.value = "";
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      const res = await axios.post("/api/login", form.value);
      if (res.data && res.data.success) {
        if (form.value.remember) {
          localStorage.setItem("loginUser", form.value.username);
        } else {
          localStorage.removeItem("loginUser");
        }
        router.push("/");
      } else {
        error.value =
          res.data && res.data.message ? res.data.message : "登录失败";
      }
    } catch (e) {
      error.value = "网络或服务器错误";
    } finally {
      loading.value = false;
    }
  });
};
const onReset = () => {
  form.value.username = "";
  form.value.password = "";
  form.value.remember = false;
  error.value = "";
};
onMounted(() => {
  const saved = localStorage.getItem("loginUser");
  if (saved) form.value.username = saved;
});
</script>
<style scoped>
.el-card {
  box-shadow: 0 4px 24px rgba(80, 80, 160, 0.08);
}
</style>
