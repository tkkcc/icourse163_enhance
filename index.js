// ==UserScript==
// @name         icourse163_enhance
// @match        https://www.icourse163.org/*
// @author       bilabila
// @version      0.0.3
// @grant        GM_getValue
// @grant        GM_setValue
// @namespace    https://greasyfork.org/users/164996
// @description  中国大学mooc增强
// ==/UserScript==
/* todos
- fix play multi video in background bug
* set autoplay delay = 0 
- wheelEvent on rateBtn
select all 'A's
make correct answer from other page
audio processing, reduce noise, prettify(deeplearnjs)
video processing
loading video multithreaing
tracks
*/
const settings = {
    currentRate: GM_getValue('rate', 2.5),
    maxRate: 4,
    minRate: 1,
    step: 0.333, //when use click
    wheelStep: 0.1,// when use wheel
    imwheelDelay: 0,
    /*for imwheel user
        x: a wheel event
        y: another wheel event followed by x triggered by imwheel
        It's good if y-x < this delay < x'-x, but sometimes y-x > x'-x, 
        if so, set this delay to 0 is better, just add twice in one wheel event
    */
}
const icourse163 = {
    selectors: {
        videoDiv: 'div.j-unitctBox.unitctBox.f-pr',
        video: 'video',
        sbg: 'div.sbg',
        bbg: 'div.bbg',
        source: 'video > source',
        qualityList: 'div.controlbar_btn.qualitybtn.j-qualitybtn ul',
        volumnBtn: 'div.controlbar_btn.volumebtn.j-volumebtn',
        rateBtn: 'div.controlbar_btn.ratebtn.j-ratebtn',
        rateBtnDiv: 'div.controlbar_btn.ratebtn.j-ratebtn > div',
        rateTxt: 'span.ratebtn_text.j-ratebtn_text',
        playBtn: 'div.controlbar_btn.playbtn.j-playbtn',
        pauseBtn: 'div.controlbar_btn.pausebtn.j-pausebtn',
    },
    nodes: {},
    //leading edge debounce
    debounce(func, delay) {
        let timer = 0
        return (...args) => {
            if (Date.now() - timer > delay) func(...args)
            timer = Date.now()
        }
    },
    waitForAll() {
        return new Promise(resolve => {
            const delay = 500
            const f = () => {
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
        const { video, rateBtn, rateTxt, qualityList, rateBtnDiv, bbg, sbg, playBtn, pauseBtn } = this.nodes
        rateBtn.removeChild(rateBtnDiv)
        this.setRate(settings.currentRate)
        bbg.addEventListener('click', () => {
            if (sbg.offsetParent !== null)
                if (video.paused) {
                    pauseBtn.click()
                } else {
                    //failed using video.pause()
                    playBtn.click()
                }
        })
        rateTxt.addEventListener('click', () => {
            this.addRate()
        })
        const wheelRate = this.debounce(e => {
            if (e.deltaY < 0)
                this.addRate({ wheel: true })
            else if (e.deltaY > 0)
                this.addRate({ wheel: true, reverse: true })
        }, settings.imwheelDelay)
        rateBtn.addEventListener("mousewheel", e => {
            e.preventDefault()
            wheelRate(e)
        })
        qualityList.addEventListener('click', () => {
            setTimeout(() => {
                this.setRate(settings.currentRate)
            }, 250)
        })
        video.removeAttribute('autoplay')
        video.setAttribute('preload', 'auto')
        video.play()
    },
    init() {
        this.waitForAll().then(() => {
            this.override()
            const config = { attributes: true, childList: true }
            const callback = async () => {
                try {
                    if (this.nodes.video.offsetParent === null) {
                        this.nodes.video.src = ''
                    }
                } catch (err) { }
                await this.waitForAll()
                this.override()
            }
            const observer = new MutationObserver(callback)
            observer.observe(this.nodes.videoDiv, config)
        })
    }
}
icourse163.init()