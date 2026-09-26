import http from "@/axios/index.js";

export function deliveryStats(params) {
    return http.get('/delivery/stats', {params})
}

export function deliveryBounces(params) {
    return http.get('/delivery/bounces', {params})
}
