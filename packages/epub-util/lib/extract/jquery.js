"use strict";
/// <reference types="jquery" />
Object.defineProperty(exports, "__esModule", { value: true });
function fixJQuery(target, $) {
    let _target = $(target);
    _target.filter('br').each(function () {
        // @ts-ignore
        let _self = $(this);
        // @ts-ignore
        $.each(this.attributes, function () {
            // @ts-ignore
            _self.removeAttr(this.name);
        });
    });
    _target.find('br').each(function () {
        // @ts-ignore
        let _self = $(this);
        // @ts-ignore
        $.each(this.attributes, function () {
            // @ts-ignore
            _self.removeAttr(this.name);
        });
    });
    return _target;
}
exports.fixJQuery = fixJQuery;
exports.default = fixJQuery;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianF1ZXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsianF1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxnQ0FBZ0M7O0FBRWhDLFNBQWdCLFNBQVMsQ0FBQyxNQUE4QixFQUFFLENBQWU7SUFFeEUsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXhCLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRXpCLGFBQWE7UUFDYixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsYUFBYTtRQUNiLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUN2QixhQUFhO1lBQ2IsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRXZCLGFBQWE7UUFDYixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsYUFBYTtRQUNiLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUN2QixhQUFhO1lBQ2IsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sT0FBTyxDQUFDO0FBQ2hCLENBQUM7QUEzQkQsOEJBMkJDO0FBRUQsa0JBQWUsU0FBUyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJqcXVlcnlcIiAvPlxuXG5leHBvcnQgZnVuY3Rpb24gZml4SlF1ZXJ5KHRhcmdldDogdW5rbm93biB8IEpRdWVyeVN0YXRpYywgJDogSlF1ZXJ5U3RhdGljKVxue1xuXHRsZXQgX3RhcmdldCA9ICQodGFyZ2V0KTtcblxuXHRfdGFyZ2V0LmZpbHRlcignYnInKS5lYWNoKGZ1bmN0aW9uICgpXG5cdHtcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0bGV0IF9zZWxmID0gJCh0aGlzKTtcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0JC5lYWNoKHRoaXMuYXR0cmlidXRlcywgZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRfc2VsZi5yZW1vdmVBdHRyKHRoaXMubmFtZSk7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdF90YXJnZXQuZmluZCgnYnInKS5lYWNoKGZ1bmN0aW9uICgpXG5cdHtcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0bGV0IF9zZWxmID0gJCh0aGlzKTtcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0JC5lYWNoKHRoaXMuYXR0cmlidXRlcywgZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRfc2VsZi5yZW1vdmVBdHRyKHRoaXMubmFtZSk7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdHJldHVybiBfdGFyZ2V0O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmaXhKUXVlcnlcbiJdfQ==