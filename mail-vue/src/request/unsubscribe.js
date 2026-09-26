import http from "@/axios/index.js";

export function unsubscribeList(page, pageSize) {
    return http.get('/unsubscribe/list', {params: {page, pageSize}})
}

export function unsubscribeRemove(id) {
    return http.delete('/unsubscribe/remove', {params: {id}})
}

export function unsubscribeSettingGet() {
    return http.get('/unsubscribe/setting')
}

export function unsubscribeSettingSave(data) {
    return http.post('/unsubscribe/setting', data)
}

export function delayedCancel(data) {
    return http.post('/delayed/cancel', data)
}
