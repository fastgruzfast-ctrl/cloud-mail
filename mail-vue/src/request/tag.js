import http from "@/axios/index.js";

export function tagList() {
    return http.get('/tag/list')
}

export function tagAdd(data) {
    return http.post('/tag/add', data)
}

export function tagUpdate(data) {
    return http.post('/tag/update', data)
}

export function tagDelete(tagId) {
    return http.delete('/tag/delete', {params: {tagId}})
}

export function tagAssign(emailIds, tagId) {
    return http.post('/tag/assign', {emailIds, tagId})
}

export function tagUnassign(emailIds, tagId) {
    return http.post('/tag/unassign', {emailIds, tagId})
}

export function tagEmailTags(emailIds) {
    return http.get('/tag/emailTags', {params: {emailIds}})
}
