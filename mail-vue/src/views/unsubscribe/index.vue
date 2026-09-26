<template>
  <div class="unsubscribe">
    <div class="header-actions">
      <div class="title">{{ $t('unsubscribeList') }}</div>
      <div class="header-right">
        <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh" :title="$t('refresh')"/>
      </div>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="setting-card" v-perm="'unsubscribe:set'">
        <div class="card-title">{{ $t('sendSetting') }}</div>
        <div class="setting-row">
          <div class="setting-item">
            <span class="label">{{ $t('siteUrl') }}</span>
            <el-input v-model="siteUrl" size="small" style="width: 260px" :placeholder="$t('siteUrlDesc')"/>
          </div>
          <div class="setting-item">
            <span class="label">{{ $t('undoSeconds') }}</span>
            <el-input-number v-model="undoSeconds" :min="0" :max="600" size="small" style="width: 140px"/>
          </div>
          <el-button type="primary" size="small" @click="saveSetting" :loading="settingLoading">
            {{ $t('save') }}
          </el-button>
        </div>
        <div class="setting-desc">{{ $t('undoSecondsDesc') }}</div>
      </div>

      <div class="loading" :class="listLoading ? 'loading-show' : 'loading-hide'">
        <loading/>
      </div>
      <div class="table-wrap" v-perm="'unsubscribe:query'">
        <el-table :data="unsubscribeData" style="width: 100%">
          <el-table-column prop="email" :label="$t('unsubscribeEmail')" min-width="220"/>
          <el-table-column prop="domain" :label="$t('domain')" min-width="160"/>
          <el-table-column prop="createTime" :label="$t('unsubscribeTime')" min-width="180">
            <template #default="scope">
              {{ formatTime(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('action')" width="120">
            <template #default="scope">
              <el-button size="small" type="danger" plain @click="removeItem(scope.row)" v-perm="'unsubscribe:set'">
                {{ $t('removeUnsubscribe') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination" v-if="total > pageSize">
          <el-pagination
              :current-page="page"
              :page-size="pageSize"
              :page-sizes="[10, 15, 20, 25, 30, 50]"
              background
              layout="prev, pager, next, sizes, total"
              :total="total"
              @size-change="sizeChange"
              @current-change="pageChange"
          />
        </div>
        <div class="empty" v-if="unsubscribeData.length === 0 && !listLoading">
          <el-empty :description="$t('noUnsubscribe')"/>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import {ref, reactive} from "vue"
import {Icon} from "@iconify/vue";
import loading from "@/components/loading/index.vue";
import {unsubscribeList, unsubscribeRemove, unsubscribeSettingGet, unsubscribeSettingSave} from "@/request/unsubscribe.js";
import {tzDayjs} from "@/utils/day.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'unsubscribe'
})

const {t} = useI18n()
const listLoading = ref(true)
const settingLoading = ref(false)
const unsubscribeData = reactive([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const siteUrl = ref('')
const undoSeconds = ref(30)

loadSetting()
getList()

function refresh() {
  getList()
}

function getList() {
  listLoading.value = true
  unsubscribeList(page.value, pageSize.value).then(data => {
    unsubscribeData.length = 0
    unsubscribeData.push(...(data?.list || []))
    total.value = data?.total || 0
    listLoading.value = false
  }).catch(() => {
    listLoading.value = false
  })
}

function pageChange(val) {
  page.value = val
  getList()
}

function sizeChange(val) {
  pageSize.value = val
  page.value = 1
  getList()
}

function loadSetting() {
  unsubscribeSettingGet().then(data => {
    siteUrl.value = data?.siteUrl || ''
    undoSeconds.value = Number(data?.undoSeconds ?? 30)
  }).catch(() => {})
}

function saveSetting() {
  settingLoading.value = true
  unsubscribeSettingSave({siteUrl: siteUrl.value, undoSeconds: undoSeconds.value}).then(() => {
    ElMessage({message: t('saveSuccessMsg'), type: 'success', plain: true})
    settingLoading.value = false
  }).catch(() => {
    settingLoading.value = false
  })
}

function removeItem(item) {
  ElMessageBox.confirm(t('removeUnsubscribeConfirm', {email: item.email}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    unsubscribeRemove(item.id).then(() => {
      ElMessage({message: t('delSuccessMsg'), type: 'success', plain: true})
      getList()
    })
  }).catch(() => {})
}

function formatTime(time) {
  if (!time) return ''
  return tzDayjs(time).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style lang="scss" scoped>
.unsubscribe {
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

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
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
