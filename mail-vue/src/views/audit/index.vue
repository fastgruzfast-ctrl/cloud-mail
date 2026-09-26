<template>
  <div class="audit">
    <div class="header-actions">
      <div class="title">{{ $t('sendAudit') }}</div>
      <div class="header-right">
        <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh" :title="$t('refresh')"/>
      </div>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="setting-card" v-perm="'audit:set'">
        <div class="card-title">{{ $t('auditSetting') }}</div>
        <div class="setting-row">
          <div class="setting-item">
            <span class="label">{{ $t('auditEnabled') }}</span>
            <el-switch v-model="auditEnabled" :active-value="1" :inactive-value="0" size="small"/>
          </div>
          <div class="setting-item">
            <span class="label">{{ $t('auditMode') }}</span>
            <el-select v-model="auditMode" size="small" style="width: 120px">
              <el-option :label="$t('auditWarn')" value="warn"/>
              <el-option :label="$t('auditBlock')" value="block"/>
            </el-select>
          </div>
          <el-button type="primary" size="small" @click="saveSetting" :loading="settingLoading">
            {{ $t('save') }}
          </el-button>
        </div>
        <div class="words-row">
          <span class="label">{{ $t('auditWords') }}</span>
          <el-input
            v-model="auditWords"
            type="textarea"
            :rows="3"
            :placeholder="$t('auditWordsPlaceholder')"
            style="width: 100%"
          />
        </div>
        <div class="setting-desc">{{ $t('auditWordsDesc') }}</div>
      </div>

      <div class="list-card" v-perm="'audit:query'">
        <el-table :data="auditData" size="small" v-loading="tableLoading" style="width: 100%">
          <el-table-column :label="$t('auditUser')" min-width="160" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.userEmail || scope.row.userId }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="toEmail" :label="$t('approvalTo')" min-width="180" show-overflow-tooltip/>
          <el-table-column prop="subject" :label="$t('approvalSubject')" min-width="200" show-overflow-tooltip/>
          <el-table-column :label="$t('hitWords')" min-width="160">
            <template #default="scope">
              <span class="hit-words">{{ scope.row.words }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('auditAction')" width="110">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.action === 'block' ? 'danger' : 'warning'">
                {{ scope.row.action === 'block' ? $t('auditBlock') : $t('auditWarn') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('auditTime')" width="170">
            <template #default="scope">
              <span>{{ formatTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next"
            size="small"
            @size-change="getList"
            @current-change="getList"
          />
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import {ref} from "vue"
import {Icon} from "@iconify/vue";
import {auditSettingGet, auditSettingSave, auditLogs} from "@/request/audit.js";
import {tzDayjs} from "@/utils/day.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'audit'
})

const {t} = useI18n()

const settingLoading = ref(false)
const tableLoading = ref(true)
const auditEnabled = ref(0)
const auditWords = ref('')
const auditMode = ref('warn')

const auditData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

getSetting()
getList()

function refresh() {
  getSetting()
  getList()
}

function getSetting() {
  auditSettingGet().then(setting => {
    auditEnabled.value = Number(setting?.auditEnabled || 0)
    auditWords.value = setting?.auditWords || ''
    auditMode.value = setting?.auditMode || 'warn'
  }).catch(() => {})
}

function saveSetting() {
  settingLoading.value = true
  auditSettingSave({auditEnabled: auditEnabled.value, auditWords: auditWords.value, auditMode: auditMode.value}).then(() => {
    ElMessage({message: t('saveSuccessMsg'), type: 'success', plain: true})
    settingLoading.value = false
  }).catch(() => {
    settingLoading.value = false
  })
}

function getList() {
  tableLoading.value = true
  auditLogs({page: page.value, pageSize: pageSize.value}).then(res => {
    auditData.value = res?.list || []
    total.value = Number(res?.total || 0)
    tableLoading.value = false
  }).catch(() => {
    tableLoading.value = false
  })
}

function formatTime(time) {
  if (!time) return ''
  return tzDayjs(time).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style lang="scss" scoped>
.audit {
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

    .words-row {
      margin-top: 12px;

      .label {
        color: var(--el-text-color-secondary);
        font-size: 13px;
        margin-bottom: 6px;
        display: block;
      }
    }

    .setting-desc {
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .list-card {
    margin: 12px 16px 16px;
    padding: 14px 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-bg-color-overlay);

    .pager {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }

    .hit-words {
      color: #e6a23c;
    }
  }
}
</style>
