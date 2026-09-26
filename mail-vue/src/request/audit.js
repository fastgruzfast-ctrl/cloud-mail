import http from "@/axios/index.js";

export function auditSettingGet() {
    return http.get('/audit/setting')
}

export function auditSettingSave(data) {
    return http.post('/audit/setting', data)
}

export function auditLogs(params) {
    return http.get('/audit/logs', {params})
}
