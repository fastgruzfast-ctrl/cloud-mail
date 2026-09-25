<template>
  <div class="tags">
    <div class="header-actions">
      <Icon class="icon" icon="ion:add-outline" width="23" height="23" @click="openAdd"/>
      <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh"/>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="loading" :class="tagLoading ? 'loading-show' : 'loading-hide'" :style="tagFirst ? 'background: transparent' : ''">
        <loading/>
      </div>
      <div class="tag-box">
        <div class="tag-item" v-for="item in tagData" :key="item.tagId">
          <div class="tag-info">
            <div class="info-left">
              <span class="color-dot" :style="{ background: item.color }"></span>
              <span class="tag-name">{{ item.name }}</span>
            </div>
            <div class="info-right">
              <Icon class="icon" icon="fluent:edit-16-regular" width="20" height="20" @click="openEdit(item)"/>
              <Icon class="icon" icon="fluent:delete-16-regular" width="20" height="20" @click="deleteTag(item)"/>
            </div>
          </div>
        </div>
      </div>
      <div class="empty" v-if="tagData.length === 0 && !tagFirst">
        <el-empty :image-size="isMobile ? 120 : null" :description="$t('noTags')"/>
      </div>
    </el-scrollbar>

    <el-dialog v-model="showForm" :title="isEdit ? $t('editTag') : $t('addTag')">
      <div class="container">
        <el-input v-model="form.name" :placeholder="$t('tagName')" maxlength="20" show-word-limit/>
        <div class="color-row">
          <span class="color-label">{{ $t('tagColor') }}：</span>
          <el-color-picker v-model="form.color"/>
        </div>
        <el-button class="btn" type="primary" @click="submit" :loading="formLoading">
          {{ isEdit ? $t('save') : $t('add') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import {defineOptions, reactive, ref} from "vue"
import {Icon} from "@iconify/vue";
import loading from "@/components/loading/index.vue";
import {useSettingStore} from "@/store/setting.js";
import {tagAdd, tagDelete, tagList, tagUpdate} from "@/request/tag.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'tags'
})

const {t} = useI18n()
const settingStore = useSettingStore()
const tagLoading = ref(true)
const tagFirst = ref(true)
const showForm = ref(false)
const formLoading = ref(false)
const isEdit = ref(false)
const isMobile = window.innerWidth < 1025

const tagData = reactive([])
const form = reactive({
  tagId: null,
  name: '',
  color: '#409EFF'
})

getList()

function getList(showLoading = false) {
  if (showLoading) {
    tagLoading.value = true
  }
  tagList().then(list => {
    tagData.length = 0
    tagData.push(...list)
    tagLoading.value = false
    setTimeout(() => {
      tagFirst.value = false
    }, 200)
  })
}

function refresh() {
  getList(true)
}

function resetForm() {
  form.tagId = null
  form.name = ''
  form.color = '#409EFF'
}

function openAdd() {
  resetForm()
  isEdit.value = false
  showForm.value = true
}

function openEdit(tag) {
  form.tagId = tag.tagId
  form.name = tag.name
  form.color = tag.color
  isEdit.value = true
  showForm.value = true
}

function submit() {
  if (formLoading.value) return

  if (!form.name || !form.name.trim()) {
    ElMessage({
      message: settingStore.lang === 'en' ? t('tagName') + ' cannot be empty' : t('tagName') + '不能为空',
      type: "error",
      plain: true
    })
    return
  }

  formLoading.value = true
  const data = {name: form.name.trim(), color: form.color}
  const api = isEdit.value
      ? tagUpdate({...data, tagId: form.tagId})
      : tagAdd(data)
  api.then(() => {
    showForm.value = false
    resetForm()
    ElMessage({
      message: isEdit.value ? t('saveSuccessMsg') : t('addSuccessMsg'),
      type: "success",
      plain: true
    })
    getList()
  }).finally(() => {
    formLoading.value = false
  })
}

function deleteTag(tag) {
  ElMessageBox.confirm(t('delConfirm', {msg: tag.name}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    tagDelete(tag.tagId).then(() => {
      getList()
      ElMessage({
        message: t('delSuccessMsg'),
        type: "success",
        plain: true
      })
    })
  })
}
</script>

<style scoped lang="scss">
.tags {
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

  .tag-box {
    padding: 15px 15px 25px 15px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;

    .tag-item {
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
      transition: all 200ms;
      padding: 15px;

      .tag-info {
        display: flex;
        align-items: center;

        .info-left {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;

          .color-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .tag-name {
            font-weight: bold;
            font-size: 16px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .info-right {
          display: flex;
          align-items: center;
          gap: 12px;

          .icon {
            cursor: pointer;
            color: #909399;
          }

          .icon:hover {
            color: var(--el-color-primary);
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

  .color-row {
    display: flex;
    align-items: center;

    .color-label {
      color: #606266;
      font-size: 14px;
    }
  }
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
