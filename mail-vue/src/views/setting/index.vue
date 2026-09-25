<template>
  <div class="box">
    <div class="container">
      <div class="title">{{$t('profile')}}</div>
      <div class="item">
        <div>{{$t('username')}}</div>
        <div>
          <span v-if="setNameShow" class="edit-name-input">
            <el-input v-model="accountName"  ></el-input>
            <span class="edit-name" @click="setName">
             {{$t('save')}}
            </span>
          </span>
          <span v-else class="user-name">
            <span >{{ userStore.user.name }}</span>
            <span class="edit-name" @click="showSetName">
             {{$t('change')}}
            </span>
          </span>
        </div>
      </div>
      <div class="item">
        <div>{{$t('emailAccount')}}</div>
        <div>{{ userStore.user.email }}</div>
      </div>
      <div class="item">
        <div>{{$t('password')}}</div>
        <div>
          <el-button type="primary" @click="pwdShow = true">{{$t('changePwdBtn')}}</el-button>
        </div>
      </div>
    </div>
    <div class="language">
      <div class="title">{{$t('language')}}</div>
      <el-select
          :model-value="langSelect"
          class="language-select"
          placeholder="Select"
          @change="changeLang"
      >
        <el-option label="中文" value="zh" @pointerdown.prevent.stop="changeLang('zh')"/>
        <el-option label="English" value="en" @pointerdown.prevent.stop="changeLang('en')"/>
      </el-select>
    </div>
    <div class="notify">
      <div class="title">{{$t('desktopNotify')}}</div>
      <el-switch v-model="notifyEnabled" @change="toggleNotify"/>
    </div>
    <div class="auto-reply">
      <div class="title">{{$t('autoReply')}}</div>
      <div class="auto-reply-form">
        <div class="auto-reply-row">
          <span>{{$t('autoReplyEnabled')}}</span>
          <el-switch v-model="autoreply.enabled"/>
        </div>
        <el-input v-model="autoreply.subject" :placeholder="$t('autoReplySubject')"/>
        <el-input v-model="autoreply.content" type="textarea" :rows="4" :placeholder="$t('autoReplyContent')"/>
        <div class="auto-reply-row">
          <span>{{$t('autoReplyStart')}}（{{$t('autoReplyEmpty')}}）</span>
          <el-date-picker v-model="autoreply.startTime" type="datetime" :placeholder="$t('autoReplyStart')"/>
        </div>
        <div class="auto-reply-row">
          <span>{{$t('autoReplyEnd')}}（{{$t('autoReplyEmpty')}}）</span>
          <el-date-picker v-model="autoreply.endTime" type="datetime" :placeholder="$t('autoReplyEnd')"/>
        </div>
        <div>
          <el-button type="primary" :loading="autoreplyLoading" @click="saveAutoreply">{{$t('save')}}</el-button>
        </div>
      </div>
    </div>
    <div class="del-email" v-perm="'my:delete'">
      <div class="title">{{$t('deleteUser')}}</div>
      <div style="color: var(--regular-text-color);">
        {{$t('delAccountMsg')}}
      </div>
      <div>
        <el-button type="primary" @click="deleteConfirm">{{$t('deleteUserBtn')}}</el-button>
      </div>
    </div>
    <el-dialog v-model="pwdShow" :title="$t('changePassword')" width="340">
      <div class="update-pwd">
        <el-input type="password" :placeholder="$t('newPassword')" v-model="form.password" autocomplete="off" @keyup.enter="submitPwd"/>
        <el-input type="password" :placeholder="$t('confirmPassword')" v-model="form.newPwd" autocomplete="off" @keyup.enter="submitPwd"/>
        <el-button type="primary" :loading="setPwdLoading" @click="submitPwd">{{$t('save')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import {reactive, ref, defineOptions, onMounted} from 'vue'
import {resetPassword, userDelete} from "@/request/my.js";
import {useUserStore} from "@/store/user.js";
import router from "@/router/index.js";
import {accountSetName} from "@/request/account.js";
import {autoreplyGet, autoreplySave} from "@/request/autoreply.js";
import {useAccountStore} from "@/store/account.js";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/setting.js";
import dayjs from "dayjs";

const { t } = useI18n()
const accountStore = useAccountStore()
const settingStore = useSettingStore()
const userStore = useUserStore();
const setPwdLoading = ref(false)
const setNameShow = ref(false)
const accountName = ref(null)
const langSelect = ref(settingStore.lang)

defineOptions({
  name: 'setting'
})

function showSetName() {
  accountName.value = userStore.user.name
  setNameShow.value = true
}

function setName() {

  if (!accountName.value) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameShow.value = false
  let name = accountName.value

  if (name === userStore.user.name) {
    return
  }

  userStore.user.name = accountName.value

  accountSetName(userStore.user.account.accountId,name).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })

    accountStore.changeUserAccountName = name

  }).catch(() => {
    userStore.user.name = name
  })
}

function changeLang(lang) {
  let setting = {}
  try {
    setting = JSON.parse(localStorage.getItem('setting') || '{}')
  } catch (e) {
    setting = {}
  }
  localStorage.setItem('setting', JSON.stringify({...setting, lang}))
  window.location.reload()
}

const pwdShow = ref(false)
const form = reactive({
  password: '',
  newPwd: '',
})

// 新邮件桌面通知（localStorage 本地设置）
const notifyEnabled = ref(false)
try {
  const s = JSON.parse(localStorage.getItem('setting') || '{}')
  notifyEnabled.value = !!s.notifyNewMail
} catch (e) {}

function toggleNotify(val) {
  let setting = {}
  try {
    setting = JSON.parse(localStorage.getItem('setting') || '{}')
  } catch (e) {}
  if (val && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(p => {
      if (p !== 'granted') {
        notifyEnabled.value = false
        ElMessage({message: t('notifyPermissionDenied'), type: 'warning', plain: true})
        return
      }
      localStorage.setItem('setting', JSON.stringify({...setting, notifyNewMail: true}))
    })
    return
  }
  if (val && 'Notification' in window && Notification.permission === 'denied') {
    notifyEnabled.value = false
    ElMessage({message: t('notifyPermissionDenied'), type: 'warning', plain: true})
    return
  }
  localStorage.setItem('setting', JSON.stringify({...setting, notifyNewMail: !!val}))
}

// 自动回复
const autoreply = reactive({enabled: false, subject: '', content: '', startTime: null, endTime: null})
const autoreplyLoading = ref(false)

onMounted(() => {
  autoreplyGet().then(data => {
    if (data) {
      autoreply.enabled = !!data.enabled
      autoreply.subject = data.subject || ''
      autoreply.content = data.content || ''
      autoreply.startTime = data.startTime || null
      autoreply.endTime = data.endTime || null
    }
  }).catch(() => {})
})

function saveAutoreply() {
  if (autoreplyLoading.value) return
  autoreplyLoading.value = true
  autoreplySave({
    enabled: autoreply.enabled,
    subject: autoreply.subject,
    content: autoreply.content,
    startTime: autoreply.startTime ? dayjs(autoreply.startTime).format('YYYY-MM-DD HH:mm:ss') : null,
    endTime: autoreply.endTime ? dayjs(autoreply.endTime).format('YYYY-MM-DD HH:mm:ss') : null,
  }).then(() => {
    ElMessage({message: t('autoReplySaved'), type: 'success', plain: true})
  }).finally(() => {
    autoreplyLoading.value = false
  })
}

const deleteConfirm = () => {
  ElMessageBox.confirm(t('delAccountConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    userDelete().then(() => {
      localStorage.removeItem('token');
      router.replace('/login');
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  })
}


function submitPwd() {

  if (setPwdLoading.value) return

  if (!form.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password !== form.newPwd) {
    ElMessage({
      message: t('confirmPwdFailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  setPwdLoading.value = true
  resetPassword(form.password).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })
    pwdShow.value = false
    setPwdLoading.value = false
    form.password = ''
    form.newPwd = ''
  }).catch(() => {
    setPwdLoading.value = false
  })

}

</script>
<style scoped lang="scss">
.box {
  padding: 40px 40px;

  @media (max-width: 767px) {
    padding: 30px 30px;
  }

  .update-pwd {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .title {
    font-size: 18px;
    font-weight: bold;
  }

  .container {
    font-size: 14px;
    display: grid;
    gap: 20px;
    margin-bottom: 40px;

    .item {
      display: grid;
      grid-template-columns: 50px 1fr;
      gap: 140px;
      position: relative;
      .user-name {
        display: grid;
        grid-template-columns: auto 1fr;
        span:first-child {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }

      .edit-name-input {
        position: absolute;
        bottom: -6px;
        .el-input {
          width: min(200px,calc(100vw - 222px));
        }
      }

      .edit-name {
        color: #4dabff;
        padding-left: 10px;
        cursor: pointer;
      }

      @media (max-width: 767px) {
        gap: 70px;
      }

      div:first-child {
        font-weight: bold;
      }

      div:last-child {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }

  .language {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 40px;

    .language-select {
      width: 100px;
    }
  }

  .notify {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 40px;
  }

  .auto-reply {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 40px;
    max-width: 560px;

    .auto-reply-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .auto-reply-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 14px;
    }
  }

  .del-email {
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}
</style>
