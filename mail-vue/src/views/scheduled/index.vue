<template>
  <div class="scheduled">
    <div class="header-actions">
      <div class="title">{{ $t('scheduledMails') }}</div>
      <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh" :title="$t('autoRefreshDesc')"/>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="loading" :class="scheduledLoading ? 'loading-show' : 'loading-hide'" :style="scheduledFirst ? 'background: transparent' : ''">
        <loading/>
      </div>
      <div class="schedule-box">
        <div class="schedule-item" v-for="item in scheduleData" :key="item.id">
          <div class="schedule-info">
            <div class="info-left">
              <div class="info-left-item">
                <div class="label">{{ $t('recipient') }}：</div>
                <div class="ellipsis">{{ item.toEmail }}</div>
              </div>
              <div class="info-left-item">
                <div class="label">{{ $t('subject') }}：</div>
                <div class="ellipsis">{{ item.subject }}</div>
              </div>
              <div class="info-left-item">
                <div class="label">{{ $t('sendAt') }}：</div>
                <div>{{ formatSendAt(item.sendAt) }}</div>
              </div>
            </div>
            <div class="info-right">
              <el-tag v-if="item.status === 'pending'" type="warning">{{ $t('scheduleStatusPending') }}</el-tag>
              <el-tag v-else-if="item.status === 'sent'" type="success">{{ $t('scheduleStatusSent') }}</el-tag>
              <el-tag v-else-if="item.status === 'failed'" type="danger">{{ $t('scheduleStatusFailed') }}</el-tag>
              <el-tag v-else type="info">{{ $t('scheduleStatusCancelled') }}</el-tag>
              <el-button
                  v-if="item.status === 'pending'"
                  type="danger"
                  size="small"
                  plain
                  @click="cancelScheduled(item)"
              >
                {{ $t('cancelSchedule') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <div class="empty" v-if="scheduleData.length === 0">
        <el-empty v-if="!scheduledFirst" :description="$t('scheduledMails')"/>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import {defineOptions, reactive, ref} from "vue"
import {Icon} from "@iconify/vue";
import loading from "@/components/loading/index.vue";
import {scheduleList, scheduleCancel} from "@/request/schedule.js";
import {useSettingStore} from "@/store/setting.js";
import dayjs from "dayjs";
import {tzDayjs} from "@/utils/day.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'scheduled'
})

const settingStore = useSettingStore();
const {t} = useI18n()
const scheduledLoading = ref(true)
const scheduledFirst = ref(true)
const scheduleData = reactive([])

getList(true)

function refresh() {
  getList(true)
}

function getList(showLoading = false) {
  if (showLoading) {
    scheduledLoading.value = true
  }
  scheduleList().then(list => {
    scheduleData.length = 0
    scheduleData.push(...list)
    scheduledLoading.value = false
    setTimeout(() => {
      scheduledFirst.value = false
    }, 200)
  })
}

function formatSendAt(sendAt) {
  if (!sendAt) {
    return ''
  }
  const sendDate = tzDayjs(sendAt);
  const currentYear = dayjs().year();
  const sendYear = sendDate.year();

  if (settingStore.lang === 'en') {

    return sendYear === currentYear
        ? sendDate.format('MMM D, HH:mm:ss')
        : sendDate.format('MMM D, YYYY HH:mm:ss');

  }

  return sendYear === currentYear
      ? sendDate.format('M月D日 HH:mm:ss')
      : sendDate.format('YYYY年M月D日 HH:mm:ss');

}

function cancelScheduled(item) {
  ElMessageBox.confirm(t('cancelSchedule'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    scheduleCancel(item.id).then(() => {
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
      getList()
    })
  });
}

</script>

<style scoped lang="scss">
.scheduled {
  height: 100%;
  overflow: hidden;
}

.scrollbar {
  height: calc(100% - 48px);
  position: relative;
  background: var(--settings-page-background);
  @media (max-width: 372px) {
    height: calc(100% - 85px);
  }

  .schedule-box {
    padding: 15px 15px 25px 15px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 15px;

    .schedule-item {
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
      transition: all 200ms;
      padding: 15px;

      .schedule-info {
        display: flex;
        gap: 10px;

        .info-left {
          flex: 1;
          min-width: 0;

          .info-left-item {
            display: flex;
            padding-top: 5px;

            .label {
              white-space: nowrap;
              flex-shrink: 0;
            }

            .ellipsis {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }

          .info-left-item:first-child {
            padding-top: 0;
          }
        }

        .info-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding-top: 2px;
          gap: 8px;
          flex-shrink: 0;
        }
      }
    }
  }
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.loading {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--loadding-background);
  z-index: 2;
}

.loading-show {
  transition: all 200ms ease 200ms;
  opacity: 1;
}

.loading-hide {
  pointer-events: none;
  transition: var(--loading-hide-transition);
  opacity: 0;
}

.header-actions {
  padding: 9px 15px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
  box-shadow: inset 0 -1px 0 0 rgba(100, 121, 143, 0.12);
  font-size: 18px;
  @media (max-width: 767px) {
    gap: 15px;
  }

  .title {
    font-weight: bold;
  }

  .icon {
    cursor: pointer;
    margin-left: auto;
  }
}
</style>
