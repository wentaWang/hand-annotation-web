<template>
  <div class="login">
    <div class="login-wrap">
      <div class="login-content">
        <p class="login-left-title">手诊标注系统</p>

        <div class="login-right-main">
          <el-form
            :key="loginType"
            ref="formRef"
            label-width="0"
            :status-icon="true"
            :model="login"
            :rules="rules"
            @keyup.enter="onLogin"
          >
            <!-- 登录方式切换 -->
            <el-form-item>
              <el-radio-group v-model="loginType" class="login-type">
                <el-radio-button label="code">验证码登录</el-radio-button>
                <el-radio-button label="password">密码登录</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <!-- 验证码登录 -->
            <div v-show="loginType === 'code'">
              <el-form-item prop="email">
                <el-input
                  v-model="login.email"
                  placeholder="请输入邮箱"
                  prefix-icon="user"
                  autocomplete="off"
                />
              </el-form-item>

              <el-form-item prop="code" class="login-code-item">
                <div class="login-code-row">
                  <el-input
                    v-model="login.code"
                    placeholder="请输入验证码"
                    prefix-icon="message"
                    autocomplete="off"
                  />
                  <el-button
                    class="code-btn"
                    :disabled="codeBtnDisabled"
                    @click="sendEmailCode"
                  >
                    {{ codeBtnText }}
                  </el-button>
                </div>
              </el-form-item>
            </div>

            <!-- 密码登录 -->
            <div v-show="loginType === 'password'">
              <el-form-item prop="username">
                <el-input
                  v-model="login.username"
                  placeholder="请输入账户名"
                  prefix-icon="user"
                  autocomplete="off"
                />
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                  v-model="login.password"
                  placeholder="请输入密码"
                  prefix-icon="lock"
                  show-password
                  autocomplete="off"
                />
              </el-form-item>
            </div>

            <!-- 登录按钮 -->
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="state.loading"
                @click="onLogin"
                class="login-right-main-btn"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <div class="login-footer">
      <p>
        Copyright © 2023-{{ state.year }}
        All Rights Reserved.
        <a href="https://beian.miit.gov.cn/" target="_blank">
          粤ICP备2025461366号-1
        </a>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import baseService from "@/service/baseService";
import { CacheToken, CacheTenantCode } from "@/constants/cacheKey";
import { getCache, setCache } from "@/utils/cache";
import { useAppStore } from "@/store";
import app from "@/constants/app";

const router = useRouter();
const store = useAppStore();

/** 登录方式 */
const loginType = ref<"code" | "password">("code");

const formRef = ref();

const login = reactive({
  username: "",
  email: "",
  code: "",
  password: "",
  loginType:""
});

const state = reactive({
  loading: false,
  tenantCode: "",
  tenantMode: "",
  year: new Date().getFullYear(),
});

/** 验证码按钮 */
const codeBtnText = ref("发送验证码");
const codeBtnDisabled = ref(false);
let timer: any = null;

/** 发送验证码 */
const sendEmailCode = () => {
  if (!login.email) {
    ElMessage.warning("请输入邮箱");
    return;
  }

  codeBtnDisabled.value = true;
  let countdown = 60;
  codeBtnText.value = `${countdown}s`;

  timer = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(timer);
      codeBtnText.value = "发送验证码";
      codeBtnDisabled.value = false;
    } else {
      codeBtnText.value = `${countdown}s`;
    }
  }, 1000);

  baseService.get("/api/mail/code", { email: login.email }).then((res) => {
    if (res.code === 0) {
      ElMessage.success("验证码已发送，请查收邮箱");
    } else {
      ElMessage.error(res.msg);
    }
  });
};

/** 动态校验规则（关键修复：用 undefined） */
const rules = computed(() => ({
  email:
    loginType.value === "code"
      ? [{ required: true, message: "请输入邮箱", trigger: "blur" }]
      : undefined,

  username:
    loginType.value === "password"
      ? [{ required: true, message: "请输入用户名", trigger: "blur" }]
      : undefined,

  code:
    loginType.value === "code"
      ? [{ required: true, message: "请输入验证码", trigger: "blur" }]
      : undefined,

  password:
    loginType.value === "password"
      ? [{ required: true, message: "请输入密码", trigger: "blur" }]
      : undefined,
}));

/** 登录 */
const onLogin = () => {
  formRef.value.validate((valid: boolean) => {
    if (!valid) return;

    state.loading = true;

    const api =
      loginType.value === "code" ? "/login/email" : "/login";

    const params =
      loginType.value === "code"
        ? { email: login.email, code: login.code }
        : { username: login.username, password: login.password };

    baseService
      .post(api, params)
      .then((res) => {
        state.loading = false;
        if (res.code === 0) {
          setCache(CacheToken, res.data, true);
          ElMessage.success("登录成功");
          router.push("/");
        } else {
          ElMessage.error(res.msg);
        }
      })
      .catch(() => {
        state.loading = false;
      });
  });
};

/** 初始化 */
onMounted(() => {
  store.logout();
  state.tenantMode = app.tenantMode;
  state.tenantCode =
    getCache(CacheTenantCode, { isParse: false }) || "10000";
});

/** 切换登录方式 */
watch(loginType, () => {
  Object.assign(login, {
    email: "",
    username: "",
    code: "",
    password: "",
  });

  nextTick(() => {
    formRef.value?.clearValidate();
  });
});
</script>

<style lang="less" scoped>
.login {
  width: 100vw;
  height: 100vh;
  background: #152ef7;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  .login-wrap {
    width: 90%;
    max-width: 420px;
    background: #fff;
    padding: 2.5rem 2rem;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  }

  .login-left-title {
    text-align: center;
    font-size: 1.6rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
  }

  .login-type {
    display: flex;
    justify-content: center;
  }

  .login-code-row {
    display: flex;
    gap: 10px;
  }

  .code-btn {
    background: #3365f8;
    color: #fff;
  }

  .login-right-main-btn {
    width: 100%;
    height: 45px;
    background: #3365f8;
    border-radius: 10px;
  }

  .login-footer {
    position: absolute;
    bottom: 10px;
    width: 100%;
    text-align: center;
    color: #fff;
    font-size: 12px;

    a {
      color: #fff;
    }
  }
}
</style>