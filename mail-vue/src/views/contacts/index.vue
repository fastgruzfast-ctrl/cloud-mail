<template>
  <div class="contacts">
    <div class="header-actions">
      <div class="search">
        <el-input
            v-model="keyword"
            class="search-input"
            :placeholder="$t('searchContact')"
            clearable
            @clear="getList"
            @keyup.enter="search"
        />
      </div>
      <Icon class="icon" icon="iconoir:search" @click="search" width="20" height="20"/>
      <el-button type="primary" size="small" @click="openAdd">{{ $t('addContact') }}</el-button>
    </div>

    <el-scrollbar class="scrollbar">
      <el-table v-if="contactData.length > 0" :data="contactData" style="width: 100%">
        <el-table-column property="name" :label="$t('contactName')" min-width="120" :show-overflow-tooltip="true"/>
        <el-table-column property="email" :label="$t('contactEmail')" min-width="200" :show-overflow-tooltip="true"/>
        <el-table-column property="remark" :label="$t('contactRemark')" min-width="160" :show-overflow-tooltip="true"/>
        <el-table-column :label="$t('editContact')" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="openEdit(scope.row)">{{ $t('editContact') }}</el-button>
            <el-button link type="danger" size="small" @click="deleteContact(scope.row)">{{ $t('delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="empty" v-else>
        <el-empty :description="$t('noContacts')"/>
      </div>
    </el-scrollbar>

    <el-dialog v-model="showDialog" :title="dialogTitle">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" class="container">
        <el-form-item :label="$t('contactName')" prop="name">
          <el-input v-model="form.name" :placeholder="$t('contactName')" @keyup.enter="submit"/>
        </el-form-item>
        <el-form-item :label="$t('contactEmail')" prop="email">
          <el-input v-model="form.email" :placeholder="$t('contactEmail')" @keyup.enter="submit"/>
        </el-form-item>
        <el-form-item :label="$t('contactRemark')" prop="remark">
          <el-input v-model="form.remark" :placeholder="$t('contactRemark')" @keyup.enter="submit"/>
        </el-form-item>
        <el-button class="btn" type="primary" @click="submit" :loading="submitLoading">{{ $t('save') }}</el-button>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import {defineOptions, reactive, ref} from "vue"
import {Icon} from "@iconify/vue";
import {contactList, contactAdd, contactUpdate, contactDelete, contactSearch} from "@/request/contact.js";
import {useI18n} from "vue-i18n";

defineOptions({
  name: 'contacts'
})

const {t} = useI18n()

const keyword = ref('')
const contactData = reactive([])
const showDialog = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  contactId: null,
  name: '',
  email: '',
  remark: ''
})

const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const rules = {
  name: [
    {required: true, message: t('contactName'), trigger: 'blur'}
  ],
  email: [
    {required: true, message: t('contactEmail'), trigger: 'blur'},
    {pattern: emailReg, message: t('contactEmail'), trigger: 'blur'}
  ]
}

getList()

function getList() {
  contactList().then(list => {
    contactData.length = 0
    contactData.push(...list)
  })
}

function search() {
  if (!keyword.value) {
    getList()
    return
  }
  contactSearch(keyword.value).then(list => {
    contactData.length = 0
    contactData.push(...list)
  })
}

function openAdd() {
  isEdit.value = false
  dialogTitle.value = t('addContact')
  resetForm()
  showDialog.value = true
}

function openEdit(row) {
  isEdit.value = true
  dialogTitle.value = t('editContact')
  form.contactId = row.contactId
  form.name = row.name
  form.email = row.email
  form.remark = row.remark || ''
  showDialog.value = true
}

function resetForm() {
  form.contactId = null
  form.name = ''
  form.email = ''
  form.remark = ''
}

function submit() {
  if (submitLoading.value) return
  formRef.value.validate(valid => {
    if (!valid) return
    submitLoading.value = true
    const api = isEdit.value ? contactUpdate : contactAdd
    api({...form}).then(() => {
      showDialog.value = false
      ElMessage({
        message: t('save'),
        type: 'success',
        plain: true
      })
      search()
    }).finally(() => {
      submitLoading.value = false
    })
  })
}

function deleteContact(row) {
  ElMessageBox.confirm(t('delConfirm', {msg: row.name || row.email}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    contactDelete(row.contactId).then(() => {
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true
      })
      search()
    })
  })
}
</script>

<style scoped lang="scss">
.contacts {
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
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.btn {
  justify-self: end;
}

:deep(.el-dialog) {
  width: 400px !important;
  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

:deep(.el-table__inner-wrapper:before) {
  background: var(--el-bg-color);
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

  .search-input {
    width: min(200px, calc(100vw - 140px));
  }

  .search {
    :deep(.el-input-group) {
      height: 28px;
    }

    :deep(.el-input__inner) {
      height: 28px;
    }
  }

  .icon {
    cursor: pointer;
  }
}
</style>
