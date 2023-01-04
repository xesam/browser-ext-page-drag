const MODE = {
    FULL: 'full',
    EDGE: 'edge'
}

const Z_INDEX = 2 ** 32 - 1;

function getPosition(event) {
    return {x: event.x, y: event.y};
}

function getMoveInfo(startPosition, event) {
    const newPos = getPosition(event);
    return {
        y: newPos.y - startPosition.y
    }
}

const toast = {
    mask: null,
    timer: null,
    create() {
        const mask = document.createElement('div');
        mask.style.zIndex = Z_INDEX;
        mask.style.position = 'fixed';
        mask.style.width = '10em';
        mask.style.top = '1em';
        mask.style.left = "50%";
        mask.style.marginLeft = "-5em";
        mask.style.backgroundColor = 'black';
        mask.style.opacity = 0.8;
        mask.style.color = 'white';
        mask.style.padding = '2em 0';
        mask.style.textAlign = 'center';
        return mask;
    },
    show(message) {
        if (!this.mask) {
            this.mask = this.create();
            document.documentElement.appendChild(this.mask);
        }
        this.mask.style.display = 'block';
        this.mask.innerText = message;
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.mask.style.display = 'none';
        }, 2000);
    }
}

const fullCtrl = {
    mask: null,
    flashView: null,
    isGrasp: false,
    startPosition: {
        x: 0,
        y: 0
    },
    startTop: 0,
    originCursor: document.documentElement.style.cursor,
    createFlash() {
        const mask = document.createElement('div');
        mask.style.opacity = 0.7;
        mask.style.textAlign = 'center';
        mask.style.padding = '1em';
        mask.style.backgroundColor = '#6663';
        mask.style.boxShadow = '0 5px 5px #6666';
        mask.style.color = "red";
        return mask;
    },
    create() {
        const mask = document.createElement('div');
        mask.style.zIndex = Z_INDEX;
        mask.style.position = 'fixed';
        mask.style.top = 0;
        mask.style.right = 0;
        mask.style.bottom = 0;
        mask.style.left = 0;
        mask.style.cursor = 'move';

        const flash = this.createFlash();
        mask.appendChild(flash);
        return [mask, flash];
    },
    flashShow(message) {
        fullCtrl.flashView.style.display = 'block';
        fullCtrl.flashView.innerText = message;
    },
    enable() {
        if (!this.mask) {
            const [mask, flash] = this.create();
            this.mask = mask;
            this.flashView = flash;
        }
        document.addEventListener('pointerdown', this.start, true);
        document.addEventListener('pointerup', this.finish, true);
        this.mask.addEventListener('pointermove', this.move, false);
        this.mask.addEventListener('pointerleave', this.cancel, false);
    },
    start(event) {
        event.preventDefault();
        fullCtrl.isGrasp = true;
        fullCtrl.startPosition = getPosition(event);
        fullCtrl.startTop = document.documentElement.scrollTop;
        document.documentElement.appendChild(fullCtrl.mask);
    },
    move(event) {
        event.preventDefault();
        if (fullCtrl.isGrasp) {
            fullCtrl.drag(event);
            fullCtrl.flashShow(chrome.i18n.getMessage('extDragging'));
        }
    },
    cancel(event) {
        event.preventDefault();
        if (fullCtrl.isGrasp) {
            fullCtrl.cleanup();
        }
    },
    finish(event) {
        event.preventDefault();
        if (fullCtrl.isGrasp) {
            fullCtrl.drag(event);
            fullCtrl.cleanup();
        }
    },
    drag(event) {
        const {y: distanceY} = getMoveInfo(fullCtrl.startPosition, event);
        document.documentElement.scrollTop = fullCtrl.startTop - distanceY;
    },
    cleanup() {
        fullCtrl.isGrasp = false;
        document.documentElement.style.cursor = fullCtrl.originCursor;
        if (fullCtrl.mask && fullCtrl.mask.parentNode) {
            document.documentElement.removeChild(fullCtrl.mask);
        }
    },
    disable() {
        fullCtrl.cleanup();
        document.removeEventListener('pointerdown', fullCtrl.start, true);
        document.removeEventListener('pointerup', fullCtrl.finish, true);
    }
};
const edgeCtrl = {
    mask: null,
    isGrasp: false,
    startPosition: {
        x: 0,
        y: 0
    },
    startTop: 0,
    create() {
        const mask = document.createElement('div');
        mask.style.zIndex = Z_INDEX;
        mask.style.position = 'fixed';
        mask.style.top = 0;
        mask.style.right = 0;
        mask.style.bottom = 0;
        mask.style.minWidth = '5em'
        mask.style.opacity = 0.5;
        mask.style.backgroundColor = '#6663';
        mask.style.boxShadow = '-3px 0 3px #6666'
        mask.style.cursor = 'move';

        mask.innerText = chrome.i18n.getMessage('extDragArea');
        mask.style.color = "red";
        mask.style.textAlign = 'center';
        mask.style.fontSize = "1.5em";
        mask.style.fontWeight = "bold";
        mask.style.lineHeight = "100vh";
        return mask;
    },
    enable() {
        if (!this.mask) {
            this.mask = this.create();
            this.mask.addEventListener('pointerdown', this.start.bind(this), true);
            this.mask.addEventListener('pointermove', this.move.bind(this), false);
            this.mask.addEventListener('pointerup', this.cancel.bind(this), true);
            this.mask.addEventListener('pointerleave', this.finish.bind(this), false);
        }
        if (!this.parentNode) {
            document.documentElement.appendChild(this.mask);
        }
    },
    start(event) {
        event.preventDefault();
        this.isGrasp = true;
        this.startPosition = getPosition(event);
        this.startTop = document.documentElement.scrollTop;
    },
    move(event) {
        event.preventDefault();
        if (this.isGrasp) {
            this.drag(event);
        }
    },
    cancel(event) {
        event.preventDefault();
        if (this.isGrasp) {
            this.cleanup();
        }
    },
    finish(event) {
        event.preventDefault();
        if (this.isGrasp) {
            this.drag(event);
            this.cleanup();
        }
    },
    drag(event) {
        const {y: distanceY} = getMoveInfo(this.startPosition, event);
        document.documentElement.scrollTop = this.startTop - distanceY;
    },
    cleanup() {
        this.isGrasp = false;
    },
    disable() {
        this.cleanup();
        if (this.mask && this.mask.parentNode) {
            document.documentElement.removeChild(this.mask);
        }
    }
};

function enableGrasp(mode = MODE.FULL) {
    if (mode === MODE.EDGE) {
        toast.show(chrome.i18n.getMessage('extToastEnableEdge'));
        fullCtrl.disable();
        edgeCtrl.enable();
    } else {
        toast.show(chrome.i18n.getMessage('extToastEnableFull'));
        edgeCtrl.disable();
        fullCtrl.enable();
    }
}

function disableGrasp() {
    toast.show(chrome.i18n.getMessage('extToastDisable'));
    fullCtrl.disable();
    edgeCtrl.disable();
}

function startListening() {
    chrome.runtime.onMessage.addListener(function ({drag}, sender, sendResponse) {
        if (!drag || drag === 'none') {
            disableGrasp();
        } else {
            enableGrasp(drag);
        }
    });
}

startListening();
