// ==UserScript==
// @name         icourse163_enhance
// @match        https://www.icourse163.org/*
// @author       bilabila
// @version      0.0.1
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==
/* todos
set autoplay delay = 0 
fix play multi video in background bug
wheelEvent on rateBtn
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
    step: 0.333
}
const icourse163 = {
    selectors: {
        videoDiv: 'div.j-unitctBox.unitctBox.f-pr',
        video: 'video',
        // sbg: 'div.sbg',
        // bbg: 'div.bbg',
        // source: 'video > source',
        qualityList: 'div.controlbar_btn.qualitybtn.j-qualitybtn ul',
        volumnBtn: 'div.controlbar_btn.volumebtn.j-volumebtn',
        rateBtn: 'div.controlbar_btn.ratebtn.j-ratebtn',
        rateTxt: 'span.ratebtn_text.j-ratebtn_text',
    },
    nodes: {},
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
    setRate(rate) {
        const { maxRate, minRate } = settings
        if (rate > maxRate || rate < minRate) rate = minRate
        GM_setValue('rate', rate)
        settings.currentRate = rate
        this.nodes.video.playbackRate = rate
        this.nodes.rateTxt.innerHTML = 'x' + rate.toFixed(1)
    },
    
    override() {
        const { video, rateBtn, rateTxt, qualityList } = this.nodes
        rateBtn.removeChild(rateBtn.querySelector('div'))
        this.setRate(settings.currentRate)
        rateTxt.addEventListener('click', () => {
            this.setRate(settings.currentRate + settings.step)
        })
        qualityList.addEventListener('click', () => {
            console.log('click')
            setTimeout(() => {
                this.setRate(settings.currentRate)
            }, 250)
        })
        // video.addEventListener('playing', () => {
        //     this.setRate(currentRate)
        // })
        video.removeAttribute('autoplay')
        video.setAttribute('preload', 'auto')
        video.play()
    },
    init() {
        this.waitForAll().then(() => {
            this.override()
            const config = { attributes: true, childList: true }
            const callback = async () => {
                await this.waitForAll()
                this.override()
            }
            const observer = new MutationObserver(callback)
            observer.observe(this.nodes.videoDiv, config)
        })
    }
}
icourse163.init()