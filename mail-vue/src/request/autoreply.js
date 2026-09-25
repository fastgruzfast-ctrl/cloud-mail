import http from "@/axios/index.js";

export function autoreplyGet() {
    return http.get('/autoreply/get')
}

export function autoreplySave(data) {
    return http.post('/autoreply/save', data)
}
