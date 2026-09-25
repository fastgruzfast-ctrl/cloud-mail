<template>
  <div class="rules">
    <div class="header-actions">
      <Icon class="icon" icon="ion:add-outline" width="23" height="23" @click="openAdd"/>
      <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh"/>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="loading" :class="rulesLoading ? 'loading-show' : 'loading-hide'" :style="rulesFirst ? 'background: transparent' : ''">
        <loading/>
      </div>
      <div class="rule-box">
        <div class="rule-item" v-for="item in ruleData" :key="item.ruleId">
          <div class="rule-info">
            <div class="info-left">
              <div class="info-left-item">
                <span class="name">{{ item.name }}</span>
              </div>
              <div class="info-left-item">
                <div>{{ $t('ruleField') }}：</div>
                <div>{{ formatCondition(item) }}</div>
              </div>
              <div class="info-left-item">
                <div>{{ $t('ruleActions') }}：</div>
                <div>{{ formatActions(item) }}</div>
              </div>
            </div>
            <div class="info-right">
              <el-switch
                  v-model="item.enabled"
                  @change="toggleEnabled(item)"
              />
              <div class="btns">
                <el-button link type="primary" size="small" @click="openEdit(item)">{{ $t('editRule') }}</el-button>
                <el-button link type="danger" size="small" @click="deleteRule(item)">{{ $t('delete') }}</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="empty" v-if="ruleData.length === 0 && !rulesLoading">
        <el-empty :description="$t('noRules')"/>
      </div>
    </el-scrollbar>

    <el-dialog v-model="showDialog" :title="isEdit ? $t('editRule') : $t('addRule')">
      <div class="container">
        <el-input v-model="form.name" :placeholder="$t('ruleNamePlaceholder')"/>
        <el-select v-model="form.field" :placeholder="$t('ruleField')">
          <el-option :label="$t('ruleFieldSender')" value="sender"/>
          <el-option :label="$t('ruleFieldSubject')" value="subject"/>
          <el-option :label="$t('ruleFieldContent')" value="content"/>
        </el-select>
        <el-select v-model="form.op" :placeholder="$t('ruleOp')">
          <el-option :label="$t('ruleOpContains')" value="contains"/>
          <el-option :label="$t('ruleOpEquals')" value="equals"/>
          <el-option :label="$t('ruleOpStarts')" value="starts"/>
        </el-select>
        <el-input v-model="form.value" :placeholder="$t('ruleValuePlaceholder')"/>
        <el-checkbox-group v-model="form.actionTypes">
          <el-checkbox :label="$t('ruleActionStar')" value="star"/>
          <el-checkbox :label="$t('ruleActionRead')" value="read"/>
          <el-checkbox :label="$t('ruleActionDelete')" value="delete"/>
          <el-checkbox :label="$t('ruleActionForward')" value="forward"/>
        </el-checkbox-group>
        <el-input
            v-if="form.actionTypes.includes('forward')"
            v-model="form.forwardToEmail"
            :placeholder="$t('forwardToEmailPlaceholder')"
        />
        <el-button class="btn" type="primary" @click="submit" :loading="submitLoading">
          {{ $t('save') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import {defineOptions, reactive, ref} from "vue"
import {Icon} from "@iconify/vue";
import loading from "@/components/loading/index.vue";
import {ruleList, ruleAdd, ruleUpdate, ruleDelete} from "@/request/rule.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'rules'
})

const {t} = useI18n()

const ruleData = reactive([])
const rulesLoading = ref(true)
const rulesFirst = ref(true)
const showDialog = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const editRuleId = ref(null)

const form = reactive({
  name: '',
  field: 'subject',
  op: 'contains',
  value: '',
  actionTypes: [],
  forwardToEmail: ''
})

const fieldLabels = {
  sender: 'ruleFieldSender',
  subject: 'ruleFieldSubject',
  content: 'ruleFieldContent'
}

const opLabels = {
  contains: 'ruleOpContains',
  equals: 'ruleOpEquals',
  starts: 'ruleOpStarts'
}

const actionLabels = {
  star: 'ruleActionStar',
  read: 'ruleActionRead',
  delete: 'ruleActionDelete',
  forward: 'ruleActionForward'
}

getList(true)

function getList(showLoading = false) {
  if (showLoading) {
    rulesLoading.value = true
  }
  ruleList().then(list => {
    ruleData.length = 0
    if (list) {
      ruleData.push(...list)
    }
    rulesLoading.value = false
    setTimeout(() => {
      rulesFirst.value = false
    }, 200)
  })
}

function refresh() {
  getList(true)
}

function parseActions(rule) {
  let actions = rule.actions
  if (!actions) {
    return []
  }
  if (typeof actions === 'string') {
    try {
      actions = JSON.parse(actions)
    } catch (e) {
      return []
    }
  }
  return Array.isArray(actions) ? actions : []
}

function formatCondition(rule) {
  const field = t(fieldLabels[rule.field] || 'ruleFieldSubject')
  const op = t(opLabels[rule.op] || 'ruleOpContains')
  return `${field} / ${op} / ${rule.value || ''}`
}

function formatActions(rule) {
  const actions = parseActions(rule)
  return actions.map(a => {
    const label = t(actionLabels[a.type] || 'ruleActionStar')
    return a.type === 'forward' && a.to ? `${label}（${a.to}）` : label
  }).join('、')
}

function toggleEnabled(rule) {
  ruleUpdate({ruleId: rule.ruleId, enabled: rule.enabled}).then(() => {
    ElMessage({
      message: t(rule.enabled ? 'ruleEnabled' : 'ruleDisabled'),
      type: 'success',
      plain: true,
    })
  }).catch(() => {
    rule.enabled = !rule.enabled
    getList()
  })
}

function resetForm() {
  form.name = ''
  form.field = 'subject'
  form.op = 'contains'
  form.value = ''
  form.actionTypes = []
  form.forwardToEmail = ''
  editRuleId.value = null
  isEdit.value = false
}

function openAdd() {
  resetForm()
  showDialog.value = true
}

function openEdit(rule) {
  resetForm()
  isEdit.value = true
  editRuleId.value = rule.ruleId
  form.name = rule.name || ''
  form.field = rule.field || 'subject'
  form.op = rule.op || 'contains'
  form.value = rule.value || ''
  const actions = parseActions(rule)
  form.actionTypes = actions.map(a => a.type)
  const forward = actions.find(a => a.type === 'forward')
  form.forwardToEmail = forward && forward.to ? forward.to : ''
  showDialog.value = true
}

function buildActions() {
  return form.actionTypes.map(type => {
    if (type === 'forward') {
      return {type: 'forward', to: form.forwardToEmail}
    }
    return {type}
  })
}

function submit() {
  if (submitLoading.value) {
    return
  }
  if (!form.name) {
    ElMessage({
      message: t('ruleNamePlaceholder'),
      type: 'error',
      plain: true,
    })
    return
  }
  if (!form.value) {
    ElMessage({
      message: t('ruleValuePlaceholder'),
      type: 'error',
      plain: true,
    })
    return
  }
  if (form.actionTypes.includes('forward') && !form.forwardToEmail) {
    ElMessage({
      message: t('forwardToEmailPlaceholder'),
      type: 'error',
      plain: true,
    })
    return
  }

  submitLoading.value = true
  const data = {
    name: form.name,
    field: form.field,
    op: form.op,
    value: form.value,
    actions: buildActions(),
    enabled: true
  }
  const request = isEdit.value
      ? ruleUpdate({...data, ruleId: editRuleId.value})
      : ruleAdd(data)
  request.then(() => {
    showDialog.value = false
    resetForm()
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })
    getList()
  }).finally(() => {
    submitLoading.value = false
  })
}

function deleteRule(rule) {
  ElMessageBox.confirm(t('delConfirm', {msg: rule.name}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    ruleDelete(rule.ruleId).then(() => {
      getList()
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true
      })
    })
  })
}
</script>

<style scoped lang="scss">
.rules {
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

  .rule-box {
    padding: 15px 15px 25px 15px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 15px;

    .rule-item {
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
      transition: all 200ms;
      padding: 15px;

      .rule-info {
        display: flex;

        .info-left {
          flex: 1;
          min-width: 0;

          .info-left-item {
            display: flex;
            padding-top: 5px;

            .name {
              font-weight: bold;
              font-size: 16px;
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

          .btns {
            display: flex;
          }
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

:deep(.el-scrollbar__view) {
  height: calc(100% - 80px);
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

.container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

:deep(.el-dialog) {
  width: 400px !important;
  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
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

  .icon {
    cursor: pointer;
  }
}
</style>
