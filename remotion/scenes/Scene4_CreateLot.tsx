/**
 * Scene 4 — Create Lot
 * Split-screen: lot creation form (left) + live preview (right).
 * Uses exact DEMO_LOT data, project's UI components styling.
 * 3D floating panel with parallax.
 */

import React from "react";
import {
  useCurrentFrame,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import { COLORS, FONT, fieldInputStyle, fieldLabelStyle, primaryButton, ghostButton, statusBadgeStyle } from "../utils/styles";
import { DEMO_LOT, LOT_CATEGORIES } from "../../components/demo/core/mock-data";
import { CinematicBackdrop, DepthShadow, LightSweep, ScanBand, SectionKicker } from "../components/Premium";

export const Scene4_CreateLot: React.FC = () => {
  const frame = useCurrentFrame();

  // Panel entrance
  const panelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelScale = interpolate(frame, [0, 25], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Field typewriter timings
  const titleChars = interpolate(frame, [20, 55], [0, DEMO_LOT.title.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleText = DEMO_LOT.title.substring(0, Math.floor(titleChars));

  // Category dropdown
  const dropdownOpen = frame >= 55 && frame < 80;
  const categorySelected = frame >= 80;

  const descChars = interpolate(frame, [80, 120], [0, DEMO_LOT.description.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const descText = DEMO_LOT.description.substring(0, Math.floor(descChars));

  const qtyChars = interpolate(frame, [120, 140], [0, DEMO_LOT.quantity.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const qtyText = DEMO_LOT.quantity.substring(0, Math.floor(qtyChars));

  const priceStr = "18500";
  const priceChars = interpolate(frame, [140, 155], [0, priceStr.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const priceText = priceStr.substring(0, Math.floor(priceChars));

  const locChars = interpolate(frame, [155, 175], [0, DEMO_LOT.location.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const locText = DEMO_LOT.location.substring(0, Math.floor(locChars));

  const photosShown = Math.floor(interpolate(frame, [175, 195], [0, 3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));

  // Submit
  const submitClick = interpolate(frame, [205, 215], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const successShow = interpolate(frame, [218, 228], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Parallax: form moves slightly different from preview
  const parallaxX = interpolate(frame, [0, 240], [0, -3], {
    extrapolateRight: "clamp",
  });

  // Cursor (approximate for visual)
  const showCursor = frame >= 20 && frame <= 210;
  const cursorY = interpolate(
    frame,
    [20, 55, 80, 120, 140, 155, 175, 195, 210],
    [250, 310, 360, 420, 450, 480, 510, 540, 620],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT.sans,
        overflow: "hidden",
      }}
    >
      <CinematicBackdrop frame={frame} glow={0.78} />
      <DepthShadow frame={frame} delay={0} width={1120} y={334} />
      <LightSweep frame={frame} start={26} end={112} opacity={0.24} />
      <ScanBand frame={frame} start={165} end={230} top="42%" height={150} opacity={0.42} />
      <SectionKicker frame={frame} delay={5}>Supplier Portal - New Lot</SectionKicker>

      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "45%",
          width: 1200,
          height: 800,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, rgba(26,86,50,0.06) 0%, transparent 60%)",
          filter: "blur(16px)",
        }}
      />

      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          opacity: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ width: 32, height: 1, backgroundColor: COLORS.brandGreen }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.35em",
            color: COLORS.brandGreen,
            textTransform: "uppercase",
          }}
        >
          SUPPLIER PORTAL — NEW LOT
        </span>
      </div>

      {/* Main content: Form + Preview */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 50,
          right: 50,
          bottom: 40,
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 30,
          opacity: panelOpacity,
          transform: `perspective(1600px) rotateX(5deg) rotateY(-8deg) rotateZ(-1.2deg) scale(${panelScale})`,
          transformStyle: "preserve-3d",
          filter: "drop-shadow(0 38px 100px rgba(0,0,0,0.52))",
        }}
      >
        {/* Left: Form */}
        <div
          style={{
            backgroundColor: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 18,
            padding: 28,
            overflow: "hidden",
            transform: `translateX(${parallaxX}px)`,
            boxShadow: "0 22px 70px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.7)",
          }}
        >
          {/* Form title */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.ink, letterSpacing: "-0.03em" }}>
              Create New Lot
            </div>
            <div style={{ fontSize: 12, color: COLORS.inkMuted, marginTop: 4 }}>
              Fill in the details for your surplus inventory listing
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Title */}
            <div>
              <span style={fieldLabelStyle}>LOT TITLE</span>
              <div style={{ ...fieldInputStyle, marginTop: 5, borderColor: frame >= 20 && frame < 55 ? COLORS.ink : COLORS.line }}>
                {titleText}
                {frame >= 20 && frame < 55 && <span style={{ display: "inline-block", width: 1.5, height: 14, backgroundColor: COLORS.ink, marginLeft: 1, verticalAlign: "middle" }} />}
              </div>
            </div>

            {/* Category */}
            <div style={{ position: "relative" }}>
              <span style={fieldLabelStyle}>CATEGORY</span>
              <div style={{ ...fieldInputStyle, marginTop: 5, color: categorySelected ? COLORS.ink : COLORS.inkMuted }}>
                {categorySelected ? DEMO_LOT.category : "Select category…"}
              </div>
              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    backgroundColor: COLORS.paper,
                    border: `1px solid ${COLORS.line}`,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    maxHeight: 160,
                    overflow: "hidden",
                  }}
                >
                  {LOT_CATEGORIES.map((cat) => {
                    const isHighlight = cat === "Textiles & Fabrics";
                    return (
                      <div
                        key={cat}
                        style={{
                          padding: "8px 14px",
                          fontSize: 12,
                          color: isHighlight ? COLORS.brandGreen : COLORS.ink,
                          backgroundColor: isHighlight ? COLORS.brandGreenMuted : "transparent",
                          fontWeight: isHighlight ? 600 : 400,
                        }}
                      >
                        {cat}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <span style={fieldLabelStyle}>DESCRIPTION</span>
              <div style={{ ...fieldInputStyle, marginTop: 5, minHeight: 56, borderColor: frame >= 80 && frame < 120 ? COLORS.ink : COLORS.line }}>
                {descText}
                {frame >= 80 && frame < 120 && <span style={{ display: "inline-block", width: 1.5, height: 14, backgroundColor: COLORS.ink, marginLeft: 1, verticalAlign: "middle" }} />}
              </div>
            </div>

            {/* Qty + Price row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <span style={fieldLabelStyle}>QUANTITY</span>
                <div style={{ ...fieldInputStyle, marginTop: 5, borderColor: frame >= 120 && frame < 140 ? COLORS.ink : COLORS.line }}>
                  {qtyText}{qtyText ? " kg" : ""}
                </div>
              </div>
              <div>
                <span style={fieldLabelStyle}>EXPECTED PRICE (USD)</span>
                <div style={{ ...fieldInputStyle, marginTop: 5, borderColor: frame >= 140 && frame < 155 ? COLORS.ink : COLORS.line }}>
                  {priceText}
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <span style={fieldLabelStyle}>LOCATION</span>
              <div style={{ ...fieldInputStyle, marginTop: 5, borderColor: frame >= 155 && frame < 175 ? COLORS.ink : COLORS.line }}>
                {locText}
              </div>
            </div>

            {/* Photos */}
            <div>
              <span style={fieldLabelStyle}>PHOTOS</span>
              <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 60,
                      height: 60,
                      border: `1px solid ${COLORS.line}`,
                      backgroundColor: i < photosShown ? COLORS.brandGreenMuted : COLORS.muted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      color: COLORS.inkMuted,
                      opacity: i < photosShown ? 1 : 0.3,
                    }}
                  >
                    {i < photosShown ? "✓" : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <div style={{ ...ghostButton, minHeight: 36, fontSize: 11 }}>SAVE DRAFT</div>
              <div
                style={{
                  ...primaryButton,
                  minHeight: 36,
                  fontSize: 11,
                  transform: submitClick > 0 ? `scale(${interpolate(submitClick, [0, 0.5, 1], [1, 0.96, 1])})` : undefined,
                  opacity: frame >= 215 ? 0.5 : 1,
                }}
              >
                {frame >= 218 ? "✓ SUBMITTED" : "SUBMIT FOR REVIEW"}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div
          style={{
            backgroundColor: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 18,
            padding: 24,
            transform: `translateX(${-parallaxX}px)`,
            boxShadow: "0 22px 70px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.7)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: COLORS.inkMuted,
              marginBottom: 16,
            }}
          >
            LIVE PREVIEW
          </div>

          {titleText ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.ink, letterSpacing: "-0.02em" }}>
                {titleText}
              </div>
              {categorySelected && (
                <span style={statusBadgeStyle("approved")}>
                  {DEMO_LOT.category}
                </span>
              )}
              {descText && (
                <div style={{ fontSize: 12, color: COLORS.inkMuted, lineHeight: 1.5 }}>
                  {descText}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                {qtyText && (
                  <div>
                    <span style={{ color: COLORS.inkMuted }}>Qty:</span>{" "}
                    <span style={{ fontWeight: 600 }}>{qtyText} kg</span>
                  </div>
                )}
                {priceText && (
                  <div>
                    <span style={{ color: COLORS.inkMuted }}>Price:</span>{" "}
                    <span style={{ fontWeight: 600 }}>${Number(priceText).toLocaleString()}</span>
                  </div>
                )}
                {locText && (
                  <div>
                    <span style={{ color: COLORS.inkMuted }}>Location:</span>{" "}
                    <span style={{ fontWeight: 600 }}>{locText}</span>
                  </div>
                )}
              </div>
              {photosShown > 0 && (
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: photosShown }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: COLORS.brandGreenMuted,
                        border: `1px solid ${COLORS.line}`,
                      }}
                    />
                  ))}
                </div>
              )}
              {/* ID tag */}
              <div style={{ fontSize: 10, color: COLORS.inkMuted, marginTop: 8 }}>
                ID: {DEMO_LOT.id} • Expires: {DEMO_LOT.expiresIn}
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                border: `1px dashed ${COLORS.line}`,
                padding: 24,
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: COLORS.ink, marginBottom: 6 }}>
                  No Data Yet
                </div>
                <div style={{ fontSize: 12, color: COLORS.inkMuted }}>
                  Start filling the form to see a live preview.
                </div>
              </div>
            </div>
          )}

          {/* Success overlay */}
          {successShow > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.95)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                opacity: successShow,
                transform: `scale(${interpolate(successShow, [0, 1], [0.95, 1])})`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: COLORS.brandGreen,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>Lot Submitted for Review</div>
              <span style={statusBadgeStyle("pending_review")}>PENDING REVIEW</span>
            </div>
          )}
        </div>
      </div>

      {/* Cursor */}
      {showCursor && (
        <div
          style={{
            position: "absolute",
            left: 480,
            top: cursorY,
            zIndex: 999,
            pointerEvents: "none",
          }}
        >
          <svg width="18" height="24" viewBox="0 0 24 32" fill="none">
            <path d="M2 2L2 26L8 20L14 30L18 28L12 18L20 18L2 2Z" fill="#050505" stroke={COLORS.brandGreen} strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
