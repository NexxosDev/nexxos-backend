"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCedula = formatCedula;
function formatCedula(raw) {
    if (!raw)
        return '';
    let cleaned = raw.replace(/[\s.,]/g, '');
    cleaned = cleaned.replace(/^[Vv]-?/, '');
    const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 8);
    if (!digits)
        return raw;
    return `V-${digits}`;
}
//# sourceMappingURL=cedula.js.map