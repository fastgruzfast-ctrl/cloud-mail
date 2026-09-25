import http from "@/axios/index.js";

export function contactList() {
    return http.get('/contact/list')
}

export function contactAdd(data) {
    return http.post('/contact/add', data)
}

export function contactUpdate(data) {
    return http.post('/contact/update', data)
}

export function contactDelete(contactId) {
    return http.delete('/contact/delete', {params: {contactId}})
}

export function contactSearch(keyword) {
    return http.get('/contact/search', {params: {keyword}})
}
