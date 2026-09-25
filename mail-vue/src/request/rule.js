import http from "@/axios/index.js";

export function ruleList() {
    return http.get('/rule/list')
}

export function ruleAdd(data) {
    return http.post('/rule/add', data)
}

export function ruleUpdate(data) {
    return http.post('/rule/update', data)
}

export function ruleDelete(ruleId) {
    return http.delete('/rule/delete', {params: {ruleId}})
}
