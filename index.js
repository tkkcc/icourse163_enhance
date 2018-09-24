// ==UserScript==
// @name         icourse163_enhance
// @match        https://www.icourse163.org/*
// @author       bilabila
// @version      0.0.4
// @grant        GM_getValue
// @grant        GM_setValue
// @namespace    https://greasyfork.org/users/164996
// @description  中国大学mooc增强
// ==/UserScript==

const settings = {
    currentRate: GM_getValue('rate', 2.5),
    maxRate: 4,
    minRate: 1,
    step: 0.333, //when use click
    wheelStep: 0.1,// when use wheel
}
const icourse163 = {
    selectors: {
        videoDiv: 'div.j-unitctBox.unitctBox.f-pr',
        video: 'video',
        qualityList: 'div.controlbar_btn.qualitybtn.j-qualitybtn ul',
        rateBtn: 'div.controlbar_btn.ratebtn.j-ratebtn',
        rateBtnDiv: 'div.controlbar_btn.ratebtn.j-ratebtn > div',
        rateTxt: 'span.ratebtn_text.j-ratebtn_text',
    },
    nodes: {},
    waitForAll() {
        const max=20 //10s
        let times = 0
        return new Promise(resolve => {
            const delay = 500
            const f = () => {
                if (times++ > max) return
                Object.entries(this.selectors).forEach(i => this.nodes[i[0]] = document.querySelector(i[1]))
                if (Object.values(this.nodes).every(v => v != null)) {
                    resolve()
                } else {
                    setTimeout(f, delay)
                }
            }
            f()
        })
    },
    setRate(rate = 0) {
        const { maxRate, minRate } = settings
        if (rate > maxRate || rate < minRate) rate = minRate
        rate = parseFloat(rate).toFixed(1)
        GM_setValue('rate', rate)
        settings.currentRate = rate
        this.nodes.video.playbackRate = rate
        this.nodes.rateTxt.innerHTML = 'x' + rate
    },
    addRate({ wheel = false, reverse = false } = { wheel: false, reverse: false }) {
        const { currentRate, step, wheelStep, maxRate } = settings
        let rate = parseFloat(currentRate) + (reverse ? -1 : 1) * (wheel ? wheelStep : step)
        // wheel mode no loop
        if (wheel && rate > maxRate) rate = maxRate
        this.setRate(rate)
    },
    override() {
        const { rateBtn, rateTxt, qualityList, rateBtnDiv } = this.nodes
        rateBtn.removeChild(rateBtnDiv)
        this.setRate(settings.currentRate)
        rateTxt.addEventListener('click', () => {
            this.addRate()
        })
        const wheelRate = e => {
            if (e.deltaY < 0)
                this.addRate({ wheel: true })
            else if (e.deltaY > 0)
                this.addRate({ wheel: true, reverse: true })
        }
        rateBtn.addEventListener("wheel", e => {
            e.preventDefault()
            wheelRate(e)
        })
        qualityList.addEventListener('click', () => {
            setTimeout(() => {
                this.setRate(settings.currentRate)
            }, 250)
        })
    },
    init() {
        this.waitForAll().then(() => {
            this.override()
            const callback = async () => {
                await this.waitForAll()
                this.override()
            }
            const observer = new MutationObserver(callback)
            observer.observe(this.nodes.videoDiv, { childList: true })
        })
    }
}
icourse163.init()