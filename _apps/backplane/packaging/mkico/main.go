// Command mkico packs PNG images into a Windows .ico file. Images smaller
// than 256 px are stored as 32-bit bitmaps (readable by every Windows tool,
// including NSIS); the 256 px image is stored as PNG, as Windows expects.
//
//	go run ./packaging/mkico -o Backplane.ico icon-16.png icon-32.png ...
package main

import (
	"bytes"
	"encoding/binary"
	"flag"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"
)

func main() {
	out := flag.String("o", "icon.ico", "output .ico file")
	flag.Parse()
	if flag.NArg() == 0 {
		fmt.Fprintln(os.Stderr, "usage: mkico -o out.ico image.png...")
		os.Exit(2)
	}
	type entry struct {
		w, h int
		data []byte
	}
	var entries []entry
	for _, path := range flag.Args() {
		raw, err := os.ReadFile(path)
		if err != nil {
			fail(err)
		}
		img, err := png.Decode(bytes.NewReader(raw))
		if err != nil {
			fail(fmt.Errorf("%s: %w", path, err))
		}
		b := img.Bounds()
		w, h := b.Dx(), b.Dy()
		if w > 256 || h > 256 {
			fail(fmt.Errorf("%s: %dx%d is larger than 256 px", path, w, h))
		}
		data := raw
		if w < 256 {
			data = bitmap(img)
		}
		entries = append(entries, entry{w, h, data})
	}
	var buf bytes.Buffer
	le := binary.LittleEndian
	_ = binary.Write(&buf, le, [3]uint16{0, 1, uint16(len(entries))})
	offset := 6 + 16*len(entries)
	for _, e := range entries {
		_ = binary.Write(&buf, le, struct {
			W, H, Colors, Reserved uint8
			Planes, Bits           uint16
			Size, Offset           uint32
		}{uint8(e.w % 256), uint8(e.h % 256), 0, 0, 1, 32, uint32(len(e.data)), uint32(offset)})
		offset += len(e.data)
	}
	for _, e := range entries {
		buf.Write(e.data)
	}
	if err := os.WriteFile(*out, buf.Bytes(), 0o644); err != nil {
		fail(err)
	}
}

// bitmap encodes img as an icon DIB: a BITMAPINFOHEADER with doubled height,
// bottom-up 32-bit BGRA pixels, then the 1-bit AND mask (set = transparent).
func bitmap(img image.Image) []byte {
	b := img.Bounds()
	w, h := b.Dx(), b.Dy()
	maskStride := ((w + 31) / 32) * 4
	var buf bytes.Buffer
	le := binary.LittleEndian
	_ = binary.Write(&buf, le, struct {
		Size                  uint32
		Width, Height         int32
		Planes, Bits          uint16
		Compression, ImgSize  uint32
		XPPM, YPPM            int32
		ColorsUsed, Important uint32
	}{40, int32(w), int32(2 * h), 1, 32, 0, uint32(w*h*4 + maskStride*h), 0, 0, 0, 0})
	for y := h - 1; y >= 0; y-- {
		for x := 0; x < w; x++ {
			c := color.NRGBAModel.Convert(img.At(b.Min.X+x, b.Min.Y+y)).(color.NRGBA)
			buf.Write([]byte{c.B, c.G, c.R, c.A})
		}
	}
	for y := h - 1; y >= 0; y-- {
		row := make([]byte, maskStride)
		for x := 0; x < w; x++ {
			if _, _, _, a := img.At(b.Min.X+x, b.Min.Y+y).RGBA(); a == 0 {
				row[x/8] |= 0x80 >> (x % 8)
			}
		}
		buf.Write(row)
	}
	return buf.Bytes()
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, "mkico:", err)
	os.Exit(1)
}
