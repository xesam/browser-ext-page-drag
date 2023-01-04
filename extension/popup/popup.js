const switchFull = document.getElementById('switch-full');
const switchEdge = document.getElementById('switch-edge');
const switchDisable = document.getElementById('switch-disable');

function init(element, i18nName, dragMode) {
    if (element) {
        element.setAttribute('value', chrome.i18n.getMessage(i18nName));
        element.addEventListener(
            'click',
            function (event) {
                sendCtrlMessageToCurrentTab({
                    drag: dragMode
                });
            },
            false);
    }
}

init(switchFull, 'extHtmlFull', 'full');
init(switchEdge, 'extHtmlEdge', 'edge');
init(switchDisable, 'extHtmlDisable', 'none');

function sendCtrlMessageToCurrentTab(ctrl) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            ctrl
        );
    });
}
