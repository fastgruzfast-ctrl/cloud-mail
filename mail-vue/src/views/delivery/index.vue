<template>
  <div class="delivery" v-perm="'delivery:query'">
    <div class="header-actions">
      <div class="title">{{ $t('deliveryStats') }}</div>
      <div class="header-right">
        <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh" :title="$t('refresh')"/>
      </div>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="filter-row">
        <div class="filter-item">
          <span class="label">{{ $t('days') }}</span>
          <el-select v-model="days" size="small" style="width: 120px" @change="loadAll">
            <el-option :label="$t('last7Days')" :value="7"/>
            <el-option :label="$t('last14Days')" :value="14"/>
            <el-option :label="$t('last30Days')" :value="30"/>
          </el-select>
        </div>
        <div class="filter-item">
          <span class="label">{{ $t('domain') }}</span>
          <el-select v-model="domain" size="small" style="width: 200px" @change="loadAll" clearable
                     :placeholder="$t('allDomains')">
            <el-option v-for="d in domainOptions" :key="d" :label="d" :value="d"/>
          </el-select>
        </div>
      </div>

      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-num">{{ totals.sent }}</div>
          <div class="card-label">{{ $t('totalSent') }}</div>
        </div>
        <div class="summary-card">
          <div class="card-num">{{ deliveryRate }}%</div>
          <div class="card-label">{{ $t('deliveryRate') }}</div>
        </div>
        <div class="summary-card">
          <div class="card-num warn">{{ totals.bounced }}</div>
          <div class="card-label">{{ $t('bouncedCount') }}</div>
        </div>
        <div class="summary-card">
          <div class="card-num danger">{{ totals.complained }}</div>
          <div class="card-label">{{ $t('complainedCount') }}</div>
        </div>
      </div>

      <div class="card-title">{{ $t('dailyStats') }}</div>
      <div class="table-wrap">
        <el-table :data="byDay" size="small" style="width: 100%" v-loading="statsLoading">
          <el-table-column prop="date" :label="$t('date')" width="120"/>
          <el-table-column prop="sent" :label="$t('totalSent')" width="90"/>
          <el-table-column prop="delivered" :label="$t('deliveredCount')" width="90"/>
          <el-table-column prop="bounced" :label="$t('bouncedCount')" width="90"/>
          <el-table-column prop="complained" :label="$t('complainedCount')" width="90"/>
          <el-table-column prop="failed" :label="$t('failedCount')" width="90"/>
          <el-table-column prop="delayed" :label="$t('delayedCount')" width="90"/>
        </el-table>
      </div>

      <div class="card-title">{{ $t('bounceList') }}</div>
      <div class="table-wrap">
        <el-table :data="bounceData" size="small" style="width: 100%" v-loading="bounceLoading">
          <el-table-column prop="sendEmail" :label="$t('sender')" width="200" show-overflow-tooltip/>
          <el-table-column prop="toEmail" :label="$t('recipient')" width="200" show-overflow-tooltip/>
          <el-table-column prop="subject" :label="$t('subject')" min-width="180" show-overflow-tooltip/>
          <el-table-column :label="$t('status')" width="100">
            <template #default="scope">
              <el-tag size="small" :type="statusTagType(scope.row.status)">
                {{ statusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" :label="$t('bounceReason')" min-width="220" show-overflow-tooltip/>
          <el-table-column :label="$t('sendTime')" width="170">
            <template #default="scope">{{ formatTime(scope.row.createTime) }}</template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination small background layout="prev, pager, next, total"
                         :total="bounceTotal" :page-size="pageSize" :current-page="page"
                         @current-change="onPageChange"/>
        </div>
        <div class="empty" v-if="bounceData.length === 0 && !bounceLoading">
          <el-empty :description="$t('noBounces')"/>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import {ref, reactive, computed} from "vue"
import {Icon} from "@iconify/vue";
import {deliveryStats, deliveryBounces} from "@/request/delivery.js";
import {tzDayjs} from "@/utils/day.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'delivery'
})

const {t} = useI18n()
const days = ref(7)
const domain = ref('')
const domainOptions = reactive([])
const byDay = reactive([])
const bounceData = reactive([])
const totals = reactive({sent: 0, delivered: 0, bounced: 0, complained: 0, failed: 0, delayed: 0})
const statsLoading = ref(false)
const bounceLoading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const bounceTotal = ref(0)

const deliveryRate = computed(() => {
  if (!totals.sent) return 0
  return ((totals.delivered / totals.sent) * 100).toFixed(1)
})

loadAll()

function refresh() {
  loadAll()
}

function loadAll() {
  loadStats()
  page.value = 1
  loadBounces()
}

function loadStats() {
  statsLoading.value = true
  deliveryStats({days: days.value, domain: domain.value || undefined}).then(data => {
    Object.assign(totals, data?.totals || {})
    byDay.length = 0
    byDay.push(...(data?.byDay || []))
    if (data?.domains) {
      domainOptions.length = 0
      domainOptions.push(...data.domains)
    }
    statsLoading.value = false
  }).catch(() => {
    statsLoading.value = false
  })
}

function loadBounces() {
  bounceLoading.value = true
  deliveryBounces({page: page.value, pageSize: pageSize.value, domain: domain.value || undefined}).then(data => {
    bounceTotal.value = Number(data?.total || 0)
    bounceData.length = 0
    bounceData.push(...(data?.list || []))
    bounceLoading.value = false
  }).catch(() => {
    bounceLoading.value = false
  })
}

function onPageChange(p) {
  page.value = p
  loadBounces()
}

function statusText(status) {
  switch (Number(status)) {
    case 3: return t('deliveryBounced')
    case 4: return t('deliveryComplained')
    case 8: return t('failed')
    default: return t('unknown')
  }
}

function statusTagType(status) {
  switch (Number(status)) {
    case 3: return 'warning'
    case 4: return 'danger'
    case 8: return 'info'
    default: return 'info'
  }
}

function formatTime(time) {
  if (!time) return ''
  return tzDayjs(time).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style lang="scss" scoped>
.delivery {
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

  .filter-row {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
    padding: 12px 16px 0;

    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .label {
        color: var(--el-text-color-secondary);
        font-size: 13px;
      }
    }
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 12px 16px 0;

    .summary-card {
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      background: var(--el-bg-color-overlay);
      padding: 14px 16px;

      .card-num {
        font-size: 24px;
        font-weight: bold;

        &.warn {
          color: var(--el-color-warning);
        }

        &.danger {
          color: var(--el-color-danger);
        }
      }

      .card-label {
        margin-top: 4px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .card-title {
    font-weight: bold;
    padding: 16px 16px 0;
  }

  .table-wrap {
    padding: 8px 16px 16px;

    .pager {
      display: flex;
      justify-content: flex-end;
      padding-top: 12px;
    }
  }

  .empty {
    padding: 40px 0;
  }
}
</style>
