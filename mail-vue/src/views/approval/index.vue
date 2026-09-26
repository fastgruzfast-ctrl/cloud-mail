<template>
  <div class="approval">
    <div class="header-actions">
      <div class="title">{{ $t('mailApproval') }}</div>
      <div class="header-right">
        <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh" :title="$t('refresh')"/>
      </div>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="setting-card" v-perm="'approval:set'">
        <div class="card-title">{{ $t('approvalSetting') }}</div>
        <div class="setting-row">
          <div class="setting-item">
            <span class="label">{{ $t('approvalEnabled') }}</span>
            <el-switch v-model="approvalEnabled" :active-value="1" :inactive-value="0" size="small"/>
          </div>
          <div class="setting-item">
            <span class="label">{{ $t('approvalUids') }}</span>
            <el-input v-model="approvalUids" size="small" style="width: 260px" :placeholder="$t('approvalUidsPlaceholder')"/>
          </div>
          <el-button type="primary" size="small" @click="saveSetting" :loading="settingLoading">
            {{ $t('save') }}
          </el-button>
        </div>
        <div class="setting-desc">{{ $t('approvalUidsDesc') }}</div>
      </div>

      <div class="list-card" v-perm="'approval:query'">
        <div class="filter-row">
          <span class="label">{{ $t('approvalStatusFilter') }}</span>
          <el-select v-model="statusFilter" size="small" style="width: 140px" @change="getList">
            <el-option :label="$t('approvalAll')" value=""/>
            <el-option :label="$t('approvalPending')" value="pending"/>
            <el-option :label="$t('approvalApproved')" value="approved"/>
            <el-option :label="$t('approvalRejected')" value="rejected"/>
          </el-select>
        </div>
        <el-table :data="approvalData" size="small" v-loading="tableLoading" style="width: 100%">
          <el-table-column :label="$t('applicant')" min-width="160">
            <template #default="scope">
              <span>{{ scope.row.applicantEmail || scope.row.userId }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="toEmail" :label="$t('approvalTo')" min-width="180" show-overflow-tooltip/>
          <el-table-column prop="subject" :label="$t('approvalSubject')" min-width="200" show-overflow-tooltip/>
          <el-table-column :label="$t('approvalStatus')" width="110">
            <template #default="scope">
              <el-tag size="small" :type="statusTagType(scope.row.status)">
                {{ statusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('approvalApplyTime')" width="170">
            <template #default="scope">
              <span>{{ formatTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('operate')" width="150">
            <template #default="scope">
              <template v-if="scope.row.status === 'pending'">
                <el-button type="success" size="small" plain @click="approveItem(scope.row)" v-perm="'approval:set'">
                  {{ $t('approve') }}
                </el-button>
                <el-button type="danger" size="small" plain @click="openReject(scope.row)" v-perm="'approval:set'">
                  {{ $t('reject') }}
                </el-button>
              </template>
              <span v-else class="reason-text">{{ scope.row.reason }}</span>
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

    <el-dialog v-model="rejectVisible" :title="$t('reject')" width="420px" :close-on-click-modal="false">
      <div class="label">{{ $t('rejectReason') }}</div>
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        :placeholder="$t('rejectReasonPlaceholder')"
      />
      <template #footer>
        <el-button size="small" @click="rejectVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" size="small" @click="rejectItem" :loading="rejectLoading">{{ $t('confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref} from "vue"
import {Icon} from "@iconify/vue";
import {approvalList, approvalSettingGet, approvalSettingSave, approvalApprove, approvalReject} from "@/request/approval.js";
import {tzDayjs} from "@/utils/day.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'approval'
})

const {t} = useI18n()

const settingLoading = ref(false)
const tableLoading = ref(true)
const approvalEnabled = ref(0)
const approvalUids = ref('')

const approvalData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const statusFilter = ref('')

const rejectVisible = ref(false)
const rejectLoading = ref(false)
const rejectReason = ref('')
const rejectRow = ref(null)

getSetting()
getList()

function refresh() {
  getSetting()
  getList()
}

function getSetting() {
  approvalSettingGet().then(setting => {
    approvalEnabled.value = Number(setting?.approvalEnabled || 0)
    approvalUids.value = setting?.approvalUids || ''
  }).catch(() => {})
}

function saveSetting() {
  settingLoading.value = true
  approvalSettingSave({approvalEnabled: approvalEnabled.value, approvalUids: approvalUids.value}).then(() => {
    ElMessage({message: t('saveSuccessMsg'), type: 'success', plain: true})
    settingLoading.value = false
  }).catch(() => {
    settingLoading.value = false
  })
}

function getList() {
  tableLoading.value = true
  approvalList({status: statusFilter.value, page: page.value, pageSize: pageSize.value}).then(res => {
    approvalData.value = res?.list || []
    total.value = Number(res?.total || 0)
    tableLoading.value = false
  }).catch(() => {
    tableLoading.value = false
  })
}

function approveItem(row) {
  ElMessageBox.confirm(t('approveConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    approvalApprove(row.id).then(() => {
      ElMessage({message: t('approveSuccess'), type: 'success', plain: true})
      getList()
    })
  }).catch(() => {})
}

function openReject(row) {
  rejectRow.value = row
  rejectReason.value = ''
  rejectVisible.value = true
}

function rejectItem() {
  rejectLoading.value = true
  approvalReject({id: rejectRow.value.id, reason: rejectReason.value}).then(() => {
    ElMessage({message: t('rejectSuccess'), type: 'success', plain: true})
    rejectVisible.value = false
    rejectLoading.value = false
    getList()
  }).catch(() => {
    rejectLoading.value = false
  })
}

function statusTagType(status) {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'approved':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'info'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'pending':
      return t('approvalPending')
    case 'approved':
      return t('approvalApproved')
    case 'rejected':
      return t('approvalRejected')
    case 'failed':
      return t('approvalFailed')
    default:
      return status
  }
}

function formatTime(time) {
  if (!time) return ''
  return tzDayjs(time).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style lang="scss" scoped>
.approval {
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

  .list-card {
    margin: 12px 16px 16px;
    padding: 14px 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-bg-color-overlay);

    .filter-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;

      .label {
        color: var(--el-text-color-secondary);
        font-size: 13px;
      }
    }

    .pager {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }

    .reason-text {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .label {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    margin-bottom: 6px;
    display: block;
  }
}
</style>
