import http from "@/axios/index.js";

export function aiSummary(emailId) {
    return http.get('/ai/summary', {params: {emailId}})
}

export function aiTranslate(emailId, lang) {
    return http.get('/ai/translate', {params: {emailId, lang}})
}
