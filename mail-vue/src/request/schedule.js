import http from "@/axios/index.js";

export function scheduleList() {
    return http.get('/schedule/list')
}

export function scheduleAdd(data) {
    return http.post('/schedule/add', data)
}

export function scheduleCancel(id) {
    return http.delete('/schedule/cancel', {params: {id}})
}
