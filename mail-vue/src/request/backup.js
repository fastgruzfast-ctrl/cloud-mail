import http from "@/axios/index.js";

export function backupList() {
    return http.get('/backup/list')
}

export function backupRun() {
    return http.post('/backup/run')
}

export function backupRemove(backupId) {
    return http.delete('/backup/remove', {params: {backupId}})
}

export function backupSetting(data) {
    return http.post('/backup/setting', data)
}

export async function backupDownload(item) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/backup/download?backupId=${item.backupId}`, {
        headers: {Authorization: `${token}`}
    })
    if (!res.ok) {
        throw new Error('download failed')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.fileName || `mail-backup-${item.backupId}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
}
