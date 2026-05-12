import AppKit

let size = NSSize(width: 1024, height: 1024)
let image = NSImage(size: size)
image.lockFocus()

let rect = NSRect(origin: .zero, size: size)

// Background gradient
let bg = NSGradient(colors: [
    NSColor(calibratedRed: 1.0, green: 0.62, blue: 0.48, alpha: 1.0),
    NSColor(calibratedRed: 1.0, green: 0.52, blue: 0.66, alpha: 1.0),
    NSColor(calibratedRed: 0.43, green: 0.84, blue: 0.77, alpha: 1.0)
])!
bg.draw(in: rect, angle: -45)

// Soft circles
NSColor(calibratedRed: 1.0, green: 0.96, blue: 0.82, alpha: 0.45).setFill()
NSBezierPath(ovalIn: NSRect(x: 70, y: 760, width: 280, height: 220)).fill()
NSColor(calibratedRed: 1.0, green: 0.86, blue: 0.92, alpha: 0.38).setFill()
NSBezierPath(ovalIn: NSRect(x: 700, y: 760, width: 260, height: 220)).fill()

// Dog head
let headRect = NSRect(x: 205, y: 260, width: 614, height: 560)
NSColor(calibratedRed: 1.0, green: 0.965, blue: 0.93, alpha: 1).setFill()
NSBezierPath(ovalIn: headRect).fill()

// Ears
NSColor(calibratedRed: 1.0, green: 0.85, blue: 0.74, alpha: 1).setFill()
let leftEar = NSBezierPath(ovalIn: NSRect(x: 230, y: 620, width: 170, height: 210))
leftEar.fill()
let rightEar = NSBezierPath(ovalIn: NSRect(x: 624, y: 620, width: 170, height: 210))
rightEar.fill()

// Eyes
NSColor(calibratedRed: 0.17, green: 0.17, blue: 0.23, alpha: 1).setFill()
NSBezierPath(ovalIn: NSRect(x: 370, y: 500, width: 78, height: 102)).fill()
NSBezierPath(ovalIn: NSRect(x: 576, y: 500, width: 78, height: 102)).fill()
NSColor.white.setFill()
NSBezierPath(ovalIn: NSRect(x: 390, y: 560, width: 18, height: 18)).fill()
NSBezierPath(ovalIn: NSRect(x: 596, y: 560, width: 18, height: 18)).fill()

// Blush
NSColor(calibratedRed: 1.0, green: 0.72, blue: 0.8, alpha: 0.7).setFill()
NSBezierPath(ovalIn: NSRect(x: 305, y: 430, width: 85, height: 40)).fill()
NSBezierPath(ovalIn: NSRect(x: 634, y: 430, width: 85, height: 40)).fill()

// Muzzle
NSColor.white.setFill()
NSBezierPath(ovalIn: NSRect(x: 420, y: 380, width: 184, height: 130)).fill()
NSColor(calibratedRed: 0.19, green: 0.19, blue: 0.25, alpha: 1).setFill()
NSBezierPath(ovalIn: NSRect(x: 484, y: 450, width: 56, height: 40)).fill()

NSColor(calibratedRed: 0.19, green: 0.19, blue: 0.25, alpha: 1).setStroke()
let mouth = NSBezierPath()
mouth.lineWidth = 6
mouth.move(to: NSPoint(x: 512, y: 450))
mouth.line(to: NSPoint(x: 512, y: 420))
mouth.move(to: NSPoint(x: 468, y: 418))
mouth.curve(to: NSPoint(x: 556, y: 418), controlPoint1: NSPoint(x: 490, y: 390), controlPoint2: NSPoint(x: 534, y: 390))
mouth.stroke()

// Tongue
NSColor(calibratedRed: 1.0, green: 0.58, blue: 0.66, alpha: 1).setFill()
NSBezierPath(roundedRect: NSRect(x: 488, y: 385, width: 48, height: 34), xRadius: 20, yRadius: 20).fill()

// Paw
NSColor(calibratedRed: 1.0, green: 0.965, blue: 0.93, alpha: 1).setFill()
NSBezierPath(ovalIn: NSRect(x: 422, y: 160, width: 180, height: 120)).fill()
for i in 0..<4 {
    NSBezierPath(ovalIn: NSRect(x: 444 + CGFloat(i) * 36, y: 250, width: 26, height: 32)).fill()
}

// Title
let title = "PAWMATE"
let attrs: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 56, weight: .black),
    .foregroundColor: NSColor(white: 1, alpha: 0.95)
]
let titleSize = title.size(withAttributes: attrs)
title.draw(at: NSPoint(x: (1024 - titleSize.width) / 2, y: 60), withAttributes: attrs)

image.unlockFocus()

if let tiff = image.tiffRepresentation,
   let bitmap = NSBitmapImageRep(data: tiff),
   let png = bitmap.representation(using: .png, properties: [:]) {
    let out = URL(fileURLWithPath: "/Users/wclu/dog_project/frontend/app-icon-1024.png")
    try png.write(to: out)
    print("Generated: \(out.path)")
} else {
    fputs("Failed to generate icon\n", stderr)
    exit(1)
}
