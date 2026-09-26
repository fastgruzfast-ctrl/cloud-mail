<template>
  <el-scrollbar class="scroll">
    <div>
      <div class="title" >
        <Icon icon="mdi:email-outline" width="24" height="24" />
        <div>{{settingStore.settings.title}}</div>
      </div>
      <el-menu :collapse="false" text-color="#fff" active-text-color="#fff" style="margin-top: 10px">
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('inbox')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon icon="cil:send" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('sent')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon icon="ep:document" width="19" height="19" />
          <span class="menu-name" style="margin-left: 17px">{{$t('drafts')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon icon="solar:star-line-duotone" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('starred')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'rules'})" index="rules"
                      :class="route.meta.name === 'rules' ? 'choose-item' : ''">
          <Icon icon="fluent:filter-20-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('mailRules')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'tags'})" index="tags"
                      :class="route.meta.name === 'tags' ? 'choose-item' : ''">
          <Icon icon="fluent:tag-20-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('mailTags')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'contacts'})" index="contacts"
                      :class="route.meta.name === 'contacts' ? 'choose-item' : ''">
          <Icon icon="fluent:contact-card-20-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('contacts')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'scheduled'})" index="scheduled"
                      :class="route.meta.name === 'scheduled' ? 'choose-item' : ''">
          <Icon icon="fluent:timer-20-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('scheduledMails')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon icon="fluent:settings-48-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('settings')}}</span>
        </el-menu-item>
        <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
          <div>{{$t('manage')}}</div>
        </div>
        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon icon="fluent:data-pie-20-regular" width="24" height="24" />
          <span class="menu-name" style="margin-left: 13px">{{$t('analytics')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'user'})" index="setting" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon icon="si:user-alt-2-line" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('allUsers')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon icon="fluent:mail-list-28-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 15px">{{$t('allMail')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="setting" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon icon="fluent:lock-closed-16-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 15px">{{$t('permissions')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon icon="fluent:fingerprint-20-filled" width="22" height="22" />
          <span class="menu-name" style="margin-left: 15px">{{$t('inviteCode')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon icon="eos-icons:system-ok-outlined" width="18" height="18" style="margin-left: 2px" />
          <span class="menu-name" style="margin-left: 17px">{{$t('SystemSettings')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'backup'})" index="backup" v-perm="'backup:query'"
                      :class="route.meta.name === 'backup' ? 'choose-item' : ''">
          <Icon icon="material-symbols:backup-outline" width="20" height="20" style="margin-left: 1px" />
          <span class="menu-name" style="margin-left: 16px">{{$t('mailBackup')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'quota'})" index="quota" v-perm="'quota:query'"
                      :class="route.meta.name === 'quota' ? 'choose-item' : ''">
          <Icon icon="material-symbols:gauge-outline" width="20" height="20" style="margin-left: 1px" />
          <span class="menu-name" style="margin-left: 16px">{{$t('sendQuota')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'delivery'})" index="delivery" v-perm="'delivery:query'"
                      :class="route.meta.name === 'delivery' ? 'choose-item' : ''">
          <Icon icon="material-symbols:monitoring" width="20" height="20" style="margin-left: 1px" />
          <span class="menu-name" style="margin-left: 16px">{{$t('deliveryStats')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'unsubscribe'})" index="unsubscribe" v-perm="'unsubscribe:query'"
                      :class="route.meta.name === 'unsubscribe' ? 'choose-item' : ''">
          <Icon icon="material-symbols:unsubscribe-outline" width="20" height="20" style="margin-left: 1px" />
          <span class="menu-name" style="margin-left: 16px">{{$t('unsubscribeList')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'approval'})" index="approval" v-perm="'approval:query'"
                      :class="route.meta.name === 'approval' ? 'choose-item' : ''">
          <Icon icon="material-symbols:approval-outline" width="20" height="20" style="margin-left: 1px" />
          <span class="menu-name" style="margin-left: 16px">{{$t('mailApproval')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'audit'})" index="audit" v-perm="'audit:query'"
                      :class="route.meta.name === 'audit' ? 'choose-item' : ''">
          <Icon icon="material-symbols:shield-outline" width="20" height="20" style="margin-left: 1px" />
          <span class="menu-name" style="margin-left: 16px">{{$t('sendAudit')}}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </el-scrollbar>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import {Icon} from "@iconify/vue";
import {useSettingStore} from "@/store/setting.js";

const settingStore = useSettingStore();
const route = useRoute();

</script>

<style lang="scss" scoped>

.title {
  margin: 15px 10px;
  height: 45px;
  border-radius: 6px;
  display: flex;
  position: relative;
  font-size: 16px;
  font-weight: bold;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #ffffff;
  background: linear-gradient(135deg, #1890ff, #3a80dd);
  transition: all 0.3s ease;
  max-width: 240px;
  padding: 0 10px;
  > div {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: calc(240px - 20px - 30px);
  }

  :deep(.el-icon) {
    flex-shrink: 0;
    font-size: 20px;
  }

  .user-right-icon {
    align-self: center;
    position: absolute;
    font-size: 12px;
    right: 8px;
    color: #ffffff;
  }

}


.manage-title {
  margin-top: 10px;
  padding-left: 20px;
  color: #fff;
}

.el-menu-item {
  margin: 3px 10px !important;
  border-radius: 6px;
  height: 36px;
  padding: 10px !important;
}

.choose-item {
  font-weight: 400;
  background: var(--aside-menu-active-background) !important;
  backdrop-filter: blur(4px);
}

@media (hover: hover) {
  .el-menu-item:hover {
    background: rgba(255, 255, 255, 0.08) !important;
  }
}

.menu-name {
  user-select: none;
}


:deep(.el-scrollbar__wrap--hidden-default ) {
  background: var(--aside-backgound) !important;
}

:deep(.el-menu-item) {
  background: var(--aside-backgound);
}

:deep(.el-menu) {
  background: var(--aside-backgound);
}

.el-menu {
  border-right: 0;
  width: 260px;
}

:deep(.el-divider__text) {
  background: var(--aside-backgound);
  color: #FFFFFF;
}

.scroll {

}
</style>
