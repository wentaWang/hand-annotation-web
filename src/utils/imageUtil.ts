export interface ImageViewerOptions {
  minScale?: number
  maxScale?: number
  canvas?: HTMLCanvasElement
}

export default class ImageViewer {
  private viewport: HTMLDivElement
  private img: HTMLImageElement
  private canvas?: HTMLCanvasElement

  private scale = 1
  private minScale: number
  private maxScale: number

  private offsetX = 0
  private offsetY = 0

  private isDragging = false
  private startX = 0
  private startY = 0

  private lastDistance = 0

  // 绑定函数（销毁时使用）
  private boundMouseMove = (e: MouseEvent) => this.onMouseMove(e)
  private boundMouseUp = () => this.onMouseUp()

  constructor(viewport: HTMLDivElement, img: HTMLImageElement, options: ImageViewerOptions = {}) {
    this.viewport = viewport
    this.img = img
    this.canvas = options.canvas
    this.minScale = options.minScale ?? 1
    this.maxScale = options.maxScale ?? 8

    this.init()

    // 图片加载后自动适应屏幕 & 居中
    this.img.onload = () => {
      this.resetViewportSize()
      this.zoomToFit()
    }
  }

  /** 设置 viewport 尺寸为图片真实尺寸 */
  private resetViewportSize() {
    this.viewport.style.width = `${this.img.naturalWidth}px`
    this.viewport.style.height = `${this.img.naturalHeight}px`

    if (this.canvas) {
      this.canvas.width = this.img.naturalWidth
      this.canvas.height = this.img.naturalHeight
    }
  }

  // -----------------------------------------------------------------------
  // 初始化事件绑定
  // -----------------------------------------------------------------------
  private init() {
    this.viewport.style.transformOrigin = "0 0"
    this.img.style.width = "100%"
    this.img.style.height = "100%"
    this.img.style.objectFit = "contain"

    // 鼠标
    this.viewport.addEventListener("mousedown", (e) => this.onMouseDown(e))
    window.addEventListener("mousemove", this.boundMouseMove)
    window.addEventListener("mouseup", this.boundMouseUp)

    // 滚轮缩放
    this.viewport.addEventListener("wheel", (e) => this.onWheel(e), { passive: false })

    // 触摸事件
    this.viewport.addEventListener("touchstart", (e) => this.onTouchStart(e), { passive: false })
    this.viewport.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false })
    this.viewport.addEventListener("touchend", () => this.onTouchEnd())
  }

  // -----------------------------------------------------------------------
  // 鼠标事件
  // -----------------------------------------------------------------------
  private onMouseDown(e: MouseEvent) {
    this.isDragging = true
    this.startX = e.clientX - this.offsetX
    this.startY = e.clientY - this.offsetY
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return
    this.offsetX = e.clientX - this.startX
    this.offsetY = e.clientY - this.startY
    this.applyTransform()
  }

  private onMouseUp() {
    this.isDragging = false
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    this.zoom(factor, e.clientX, e.clientY)
  }

  // -----------------------------------------------------------------------
  // 触摸事件
  // -----------------------------------------------------------------------
  private onTouchStart(e: TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1) {
      // 拖拽
      const t = e.touches[0]
      this.isDragging = true
      this.startX = t.clientX - this.offsetX
      this.startY = t.clientY - this.offsetY
    } else if (e.touches.length === 2) {
      // 双指缩放
      this.isDragging = false
      this.lastDistance = this.getDistance(e.touches)
    }
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1 && this.scale >= this.minScale) {
      const t = e.touches[0]
      this.offsetX = t.clientX - this.startX
      this.offsetY = t.clientY - this.startY
      this.applyTransform()
    } else if (e.touches.length === 2) {
      const newDist = this.getDistance(e.touches)
      const delta = newDist - this.lastDistance

      if (Math.abs(delta) > 2) {
        this.zoom(delta > 0 ? 1.03 : 0.97)
      }
      this.lastDistance = newDist
    }
  }

  private onTouchEnd() {
    this.isDragging = false
  }

  private getDistance(t: TouchList) {
    const dx = t[0].clientX - t[1].clientX
    const dy = t[0].clientY - t[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // -----------------------------------------------------------------------
  // 缩放 + 平移
  // -----------------------------------------------------------------------
  private zoom(factor: number, cx?: number, cy?: number) {
    let newScale = this.scale * factor
    newScale = Math.max(this.minScale, Math.min(newScale, this.maxScale))

    if (cx !== undefined && cy !== undefined) {
      const rect = this.viewport.getBoundingClientRect()
      const dx = cx - rect.left
      const dy = cy - rect.top

      this.offsetX -= (newScale / this.scale - 1) * dx
      this.offsetY -= (newScale / this.scale - 1) * dy
    }

    this.scale = newScale
    this.applyTransform()
  }

  private applyTransform() {
    this.viewport.style.transform =
      `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`

    if (this.canvas) {
      this.canvas.style.transform =
        `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`
    }
  }

  // -----------------------------------------------------------------------
  // 公共方法
  // -----------------------------------------------------------------------
  /** 等比适应整个可视区域 */
  public zoomToFit() {
    const box = this.viewport.parentElement!
    const boxW = box.clientWidth
    const boxH = box.clientHeight

    const ratio = Math.min(
      boxW / this.img.naturalWidth,
      boxH / this.img.naturalHeight
    )

    this.scale = Math.max(this.minScale, Math.min(ratio, this.maxScale))
    this.center()
  }

  /** 居中图片 */
  public center() {
    const box = this.viewport.parentElement!
    const boxW = box.clientWidth
    const boxH = box.clientHeight

    const w = this.img.naturalWidth * this.scale
    const h = this.img.naturalHeight * this.scale

    this.offsetX = (boxW - w) / 2
    this.offsetY = (boxH - h) / 2

    this.applyTransform()
  }

  public getScale() {
    return this.scale
  }

  public setScale(s: number) {
    this.scale = Math.max(this.minScale, Math.min(s, this.maxScale))
    this.applyTransform()
  }

  public destroy() {
    // 解绑事件
    window.removeEventListener("mousemove", this.boundMouseMove)
    window.removeEventListener("mouseup", this.boundMouseUp)
  }
}
