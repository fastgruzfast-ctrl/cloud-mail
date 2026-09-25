import http from "@/axios/index.js";

export function templateList() {
    return http.get('/template/list')
}

export function templateAdd(data) {
    return http.post('/template/add', data)
}

export function templateUpdate(data) {
    return http.post('/template/update', data)
}

export function templateDelete(id) {
    return http.delete('/template/delete', {params: {id}})
}
