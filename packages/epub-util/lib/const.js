"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createEpubContextDate() {
    return new Date('2000-12-24 23:00:00Z');
}
exports.createEpubContextDate = createEpubContextDate;
function createJSZipGeneratorOptions() {
    return {
        type: 'nodebuffer',
        mimeType: 'application/epub+zip',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        },
    };
}
exports.createJSZipGeneratorOptions = createJSZipGeneratorOptions;
/**
 * 固定 epub 內檔案日期 用來保持相同的 md5
 */
exports.EPUB_CONTEXT_DATE = createEpubContextDate();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb25zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLFNBQWdCLHFCQUFxQjtJQUVwQyxPQUFPLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUE7QUFDeEMsQ0FBQztBQUhELHNEQUdDO0FBRUQsU0FBZ0IsMkJBQTJCO0lBRTFDLE9BQU87UUFDTixJQUFJLEVBQUUsWUFBWTtRQUNsQixRQUFRLEVBQUUsc0JBQXNCO1FBQ2hDLFdBQVcsRUFBRSxTQUFTO1FBQ3RCLGtCQUFrQixFQUFFO1lBQ25CLEtBQUssRUFBRSxDQUFDO1NBQ1I7S0FDUSxDQUFBO0FBQ1gsQ0FBQztBQVZELGtFQVVDO0FBRUQ7O0dBRUc7QUFDVSxRQUFBLGlCQUFpQixHQUFHLHFCQUFxQixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcHViQ29udGV4dERhdGUoKVxue1xuXHRyZXR1cm4gbmV3IERhdGUoJzIwMDAtMTItMjQgMjM6MDA6MDBaJylcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUpTWmlwR2VuZXJhdG9yT3B0aW9ucygpXG57XG5cdHJldHVybiB7XG5cdFx0dHlwZTogJ25vZGVidWZmZXInLFxuXHRcdG1pbWVUeXBlOiAnYXBwbGljYXRpb24vZXB1Yit6aXAnLFxuXHRcdGNvbXByZXNzaW9uOiAnREVGTEFURScsXG5cdFx0Y29tcHJlc3Npb25PcHRpb25zOiB7XG5cdFx0XHRsZXZlbDogOVxuXHRcdH0sXG5cdH0gYXMgY29uc3Rcbn1cblxuLyoqXG4gKiDlm7rlrpogZXB1YiDlhafmqpTmoYjml6XmnJ8g55So5L6G5L+d5oyB55u45ZCM55qEIG1kNVxuICovXG5leHBvcnQgY29uc3QgRVBVQl9DT05URVhUX0RBVEUgPSBjcmVhdGVFcHViQ29udGV4dERhdGUoKTtcblxuIl19