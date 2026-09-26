import http from "@/axios/index.js";

export function approvalList(params) {
    return http.get('/approval/list', {params})
}

export function approvalSettingGet() {
    return http.get('/approval/setting')
}

export function approvalSettingSave(data) {
    return http.post('/approval/setting', data)
}

export function approvalApprove(id) {
    return http.post('/approval/approve', {id})
}

export function approvalReject(data) {
    return http.post('/approval/reject', data)
}
