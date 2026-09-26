<template>
  <div class="quota">
    <div class="header-actions">
      <div class="title">{{ $t('sendQuota') }}</div>
      <div class="header-right">
        <el-button type="primary" size="small" @click="openDialog()" v-perm="'quota:set'">
          {{ $t('addQuota') }}
        </el-button>
        <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh" :title="$t('refresh')"/>
      </div>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="setting-card" v-perm="'quota:set'">
        <div class="card-title">{{ $t('quotaSetting') }}</div>
        <div class="setting-row">
          <div class="setting-item">
            <span class="label">{{ $t('quotaEnabled') }}</span>
            <el-switch v-model="quotaEnabled"/>
          </div>
          <el-button type="primary" size="small" @click="saveSetting" :loading="settingLoading">
            {{ $t('save') }}
          </el-button>
        </div>
        <div class="setting-desc">{{ $t('quotaSettingDesc') }}</div>
      </div>

      <div class="loading" :class="listLoading ? 'loading-show' : 'loading-hide'">
        <loading/>
      </div>
      <div class="table-wrap" v-perm="'quota:query'">
        <el-table :data="quotaData" size="small" style="width: 100%">
          <el-table-column prop="domain" :label="$t('domain')"/>
          <el-table-column prop="dayLimit" :label="$t('dayLimit')" width="110"/>
          <el-table-column :label="$t('warmupEnabled')" width="90">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.warmupEnabled ? 'success' : 'info'">
                {{ scope.row.warmupEnabled ? $t('enabled') : $t('disabled') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="warmupStart" :label="$t('warmupStart')" width="120"/>
          <el-table-column prop="warmupStartLimit" :label="$t('warmupStartLimit')" width="100"/>
          <el-table-column prop="warmupStep" :label="$t('warmupStep')" width="90"/>
          <el-table-column prop="warmupMax" :label="$t('warmupMax')" width="100"/>
          <el-table-column :label="$t('todaySent') + ' / ' + $t('effectiveLimit')" width="150">
            <template #default="scope">
              <span :class="{'over-limit': scope.row.todaySent >= scope.row.effectiveLimit}">
                {{ scope.row.todaySent }} / {{ scope.row.effectiveLimit }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('operate')" width="150" v-perm="'quota:set'">
            <template #default="scope">
              <el-button size="small" @click="openDialog(scope.row)" v-perm="'quota:set'">
                {{ $t('edit') }}
              </el-button>
              <el-button size="small" type="danger" plain @click="removeItem(scope.row)" v-perm="'quota:set'">
                {{ $t('delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="empty" v-if="quotaData.length === 0 && !listLoading">
          <el-empty :description="$t('noQuota')"/>
        </div>
      </div>
    </el-scrollbar>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px">
      <el-form :model="form" label-width="110px" size="small">
        <el-form-item :label="$t('domain')">
          <el-input v-model="form.domain" :disabled="!!form.isEdit" :placeholder="$t('quotaDomainPlaceholder')"/>
        </el-form-item>
        <el-form-item :label="$t('dayLimit')">
          <el-input-number v-model="form.dayLimit" :min="1" :max="100000" style="width: 100%"/>
        </el-form-item>
        <el-form-item :label="$t('warmupEnabled')">
          <el-switch v-model="form.warmupEnabled"/>
        </el-form-item>
        <el-form-item :label="$t('warmupStart')">
          <el-date-picker v-model="form.warmupStart" type="date" value-format="YYYY-MM-DD"
                          :placeholder="$t('warmupStartPlaceholder')" style="width: 100%"/>
        </el-form-item>
        <el-form-item :label="$t('warmupStartLimit')">
          <el-input-number v-model="form.warmupStartLimit" :min="1" :max="100000" style="width: 100%"/>
        </el-form-item>
        <el-form-item :label="$t('warmupStep')">
          <el-input-number v-model="form.warmupStep" :min="0" :max="100000" style="width: 100%"/>
        </el-form-item>
        <el-form-item :label="$t('warmupMax')">
          <el-input-number v-model="form.warmupMax" :min="1" :max="100000" style="width: 100%"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="dialogVisible = false">{{ $t('cancel') }}</el-button>
        <el-button size="small" type="primary" @click="saveQuota" :loading="saveLoading">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive} from "vue"
import {Icon} from "@iconify/vue";
import loading from "@/components/loading/index.vue";
import {quotaList, quotaSave, quotaSetting, quotaRemove} from "@/request/quota.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'quota'
})

const {t} = useI18n()
const listLoading = ref(true)
const settingLoading = ref(false)
const saveLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const quotaData = reactive([])
const quotaEnabled = ref(false)

const form = reactive({
  isEdit: false,
  domain: '',
  dayLimit: 100,
  warmupEnabled: false,
  warmupStart: '',
  warmupStartLimit: 20,
  warmupStep: 20,
  warmupMax: 100
})

getList()

function refresh() {
  getList()
}

function getList() {
  listLoading.value = true
  quotaList().then(data => {
    quotaEnabled.value = !!data?.enabled
    quotaData.length = 0
    quotaData.push(...(data?.list || []))
    listLoading.value = false
  }).catch(() => {
    listLoading.value = false
  })
}

function saveSetting() {
  settingLoading.value = true
  quotaSetting({quotaEnabled: quotaEnabled.value ? 1 : 0}).then(() => {
    ElMessage({message: t('saveSuccessMsg'), type: 'success', plain: true})
    settingLoading.value = false
  }).catch(() => {
    settingLoading.value = false
  })
}

function openDialog(row) {
  if (row) {
    dialogTitle.value = t('editQuota')
    form.isEdit = true
    form.domain = row.domain
    form.dayLimit = row.dayLimit
    form.warmupEnabled = !!row.warmupEnabled
    form.warmupStart = row.warmupStart || ''
    form.warmupStartLimit = row.warmupStartLimit
    form.warmupStep = row.warmupStep
    form.warmupMax = row.warmupMax
  } else {
    dialogTitle.value = t('addQuota')
    form.isEdit = false
    form.domain = ''
    form.dayLimit = 100
    form.warmupEnabled = false
    form.warmupStart = ''
    form.warmupStartLimit = 20
    form.warmupStep = 20
    form.warmupMax = 100
  }
  dialogVisible.value = true
}

function saveQuota() {
  if (!form.domain.trim()) {
    ElMessage({message: t('quotaDomainRequired'), type: 'warning', plain: true})
    return
  }
  saveLoading.value = true
  quotaSave({
    domain: form.domain.trim(),
    dayLimit: form.dayLimit,
    warmupEnabled: form.warmupEnabled ? 1 : 0,
    warmupStart: form.warmupStart || '',
    warmupStartLimit: form.warmupStartLimit,
    warmupStep: form.warmupStep,
    warmupMax: form.warmupMax
  }).then(() => {
    ElMessage({message: t('saveSuccessMsg'), type: 'success', plain: true})
    dialogVisible.value = false
    saveLoading.value = false
    getList()
  }).catch(() => {
    saveLoading.value = false
  })
}

function removeItem(row) {
  ElMessageBox.confirm(t('delQuotaConfirm', {domain: row.domain}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    quotaRemove(row.domain).then(() => {
      ElMessage({message: t('delSuccessMsg'), type: 'success', plain: true})
      getList()
    })
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.quota {
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

  .table-wrap {
    padding: 12px 16px 16px;
  }

  .over-limit {
    color: var(--el-color-danger);
    font-weight: bold;
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
