import http from "@/axios/index.js";

export function quotaList() {
    return http.get('/quota/list')
}

export function quotaSave(data) {
    return http.post('/quota/save', data)
}

export function quotaSetting(data) {
    return http.post('/quota/setting', data)
}

export function quotaRemove(domain) {
    return http.delete('/quota/remove', {params: {domain}})
}
