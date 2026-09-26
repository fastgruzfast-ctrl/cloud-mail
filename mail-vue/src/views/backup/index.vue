<template>
  <div class="backup">
    <div class="header-actions">
      <div class="title">{{ $t('mailBackup') }}</div>
      <div class="header-right">
        <el-button type="primary" size="small" @click="runBackup" :loading="runLoading" v-perm="'backup:set'">
          {{ $t('backupNow') }}
        </el-button>
        <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh" :title="$t('refresh')"/>
      </div>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="setting-card" v-perm="'backup:set'">
        <div class="card-title">{{ $t('backupSetting') }}</div>
        <div class="setting-row">
          <div class="setting-item">
            <span class="label">{{ $t('backupCron') }}</span>
            <el-select v-model="backupCron" size="small" style="width: 140px">
              <el-option :label="$t('disabled')" :value="0"/>
              <el-option :label="$t('backupDaily')" :value="1"/>
              <el-option :label="$t('backupWeekly')" :value="2"/>
              <el-option :label="$t('backupMonthly')" :value="3"/>
            </el-select>
          </div>
          <div class="setting-item">
            <span class="label">{{ $t('backupKeep') }}</span>
            <el-input-number v-model="backupKeep" :min="1" :max="100" size="small" style="width: 140px"/>
          </div>
          <el-button type="primary" size="small" @click="saveSetting" :loading="settingLoading">
            {{ $t('save') }}
          </el-button>
        </div>
        <div class="setting-desc">{{ $t('backupSettingDesc') }}</div>
      </div>

      <div class="loading" :class="backupLoading ? 'loading-show' : 'loading-hide'">
        <loading/>
      </div>
      <div class="backup-list">
        <div class="backup-item" v-for="item in backupData" :key="item.backupId">
          <div class="backup-info">
            <div class="info-left">
              <div class="file-name">{{ item.fileName }}</div>
              <div class="file-meta">
                <span>{{ formatTime(item.createTime) }}</span>
                <span>{{ $t('backupEmailCount', {count: item.emailCount}) }}</span>
                <span>{{ formatSize(item.size) }}</span>
              </div>
            </div>
            <div class="info-right">
              <el-button size="small" @click="downloadItem(item)" v-perm="'backup:query'">
                {{ $t('download') }}
              </el-button>
              <el-button size="small" type="danger" plain @click="removeItem(item)" v-perm="'backup:set'">
                {{ $t('delete') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <div class="empty" v-if="backupData.length === 0 && !backupLoading">
        <el-empty :description="$t('noBackup')"/>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import {ref, reactive, watch} from "vue"
import {Icon} from "@iconify/vue";
import loading from "@/components/loading/index.vue";
import {backupList, backupRun, backupRemove, backupSetting, backupDownload} from "@/request/backup.js";
import {useSettingStore} from "@/store/setting.js";
import {storeToRefs} from "pinia";
import {tzDayjs} from "@/utils/day.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'backup'
})

const settingStore = useSettingStore();
const {settings} = storeToRefs(settingStore);
const {t} = useI18n()
const backupLoading = ref(true)
const runLoading = ref(false)
const settingLoading = ref(false)
const backupData = reactive([])

const backupCron = ref(0)
const backupKeep = ref(7)

watch(settings, (val) => {
  if (val) {
    backupCron.value = Number(val.backupCron || 0)
    backupKeep.value = Number(val.backupKeep || 7)
  }
}, {immediate: true})

getList()

function refresh() {
  getList()
}

function getList() {
  backupLoading.value = true
  backupList().then(list => {
    backupData.length = 0
    backupData.push(...(list || []))
    backupLoading.value = false
  }).catch(() => {
    backupLoading.value = false
  })
}

function runBackup() {
  ElMessageBox.confirm(t('backupNowConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    runLoading.value = true
    backupRun().then(() => {
      ElMessage({message: t('backupSuccess'), type: 'success', plain: true})
      getList()
      runLoading.value = false
    }).catch(() => {
      runLoading.value = false
    })
  }).catch(() => {})
}

function saveSetting() {
  settingLoading.value = true
  backupSetting({backupCron: backupCron.value, backupKeep: backupKeep.value}).then(() => {
    ElMessage({message: t('saveSuccessMsg'), type: 'success', plain: true})
    if (settings.value) {
      settings.value.backupCron = backupCron.value
      settings.value.backupKeep = backupKeep.value
    }
    settingLoading.value = false
  }).catch(() => {
    settingLoading.value = false
  })
}

function downloadItem(item) {
  backupDownload(item).catch(() => {
    ElMessage({message: t('downloadFail'), type: 'error', plain: true})
  })
}

function removeItem(item) {
  ElMessageBox.confirm(t('backupDeleteConfirm', {name: item.fileName}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    backupRemove(item.backupId).then(() => {
      ElMessage({message: t('delSuccessMsg'), type: 'success', plain: true})
      getList()
    })
  }).catch(() => {})
}

function formatTime(time) {
  if (!time) return ''
  return tzDayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

function formatSize(size) {
  size = Number(size) || 0
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / 1024 / 1024).toFixed(1) + ' MB'
}
</script>

<style lang="scss" scoped>
.backup {
  height: 100%;
  display: flex;
  flex-direction: column;

  .header-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .title {
      font-size: 16px;
      font-weight: bold;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;

      .icon {
        cursor: pointer;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .scrollbar {
    flex: 1;
  }

  .setting-card {
    margin: 12px 16px 0;
    padding: 14px 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-bg-color-overlay);

    .card-title {
      font-weight: bold;
      margin-bottom: 10px;
    }

    .setting-row {
      display: flex;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;

      .setting-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          color: var(--el-text-color-secondary);
          font-size: 13px;
        }
      }
    }

    .setting-desc {
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .backup-list {
    padding: 4px 16px 16px;
  }

  .backup-item {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    margin-top: 10px;
    padding: 12px 14px;

    .backup-info {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .info-left {
        .file-name {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .file-meta {
          display: flex;
          gap: 14px;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .info-right {
        display: flex;
        gap: 8px;
      }
    }
  }

  .empty {
    padding: 40px 0;
  }

  .loading {
    transition: opacity 0.2s;
  }

  .loading-show {
    opacity: 1;
  }

  .loading-hide {
    opacity: 0;
    pointer-events: none;
    height: 0;
    overflow: hidden;
  }
}
</style>
