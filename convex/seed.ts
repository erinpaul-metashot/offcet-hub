"use node";

/**
 * Demo Data Seeder
 *
 * Creates a rich, realistic dataset for demoing every feature and state of the Offcet Hub app:
 *   - 5 Suppliers  (3 approved, 1 pending, 1 rejected)
 *   - 5 Buyers     (3 approved, 1 pending, 1 rejected)
 *   - 6 Lots       (one per status: draft / pending_review / approved / assigned / sold / expired)
 *   - 2 Assignments on the "assigned" lot (buyer1 = interested, buyer2 = pending)
 *
 * Images are fetched from Picsum Photos and stored in Convex file storage so lots
 * display real images instead of broken thumbnails.
 *
 * Guard: aborts silently if supplier1@gmail.com already exists.
 *
 * Run with:
 *   npx convex run seed:seedDemoData --prod
 *
 * To wipe and re-seed (e.g. after fixing emails):
 *   npx convex run seed:resetSeedData --prod
 *   npx convex run seed:seedDemoData --prod
 */

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAuth } from "./auth";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";

// ─── Image Upload Helper ──────────────────────────────────────────────────────

/**
 * Downloads a public image and stores it in Convex file storage.
 * Returns the resulting storage ID.
 */
async function uploadImageFromUrl(
  ctx: ActionCtx,
  imageUrl: string,
): Promise<Id<"_storage">> {
  // Generate a short-lived signed upload URL via a helper mutation
  const uploadUrl: string = await ctx.runMutation(
    internal.seedHelpers.getUploadUrl,
    {},
  );

  // Fetch the public image, following any redirects
  const imageRes = await fetch(imageUrl, { redirect: "follow" });
  if (!imageRes.ok) {
    throw new Error(
      `Failed to fetch image (${imageRes.status}): ${imageUrl}`,
    );
  }

  const contentType =
    imageRes.headers.get("content-type") ?? "image/jpeg";
  const buffer = await imageRes.arrayBuffer();

  // Upload the raw bytes to Convex storage
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Failed to upload image to Convex storage: ${text}`);
  }

  const { storageId } = (await uploadRes.json()) as { storageId: string };
  return storageId as Id<"_storage">;
}

// ─── Reset Action ─────────────────────────────────────────────────────────────

/**
 * Wipes all previously seeded demo users (and their lots / assignments / profiles)
 * from both the Convex database and the better-auth user store.
 *
 * Pass `domain` to target either the old wrong domain ("@regime.com")
 * or the correct one ("@gmail.com") — defaults to "@regime.com".
 */
export const resetSeedData = internalAction({
  args: {},
  handler: async (ctx) => {
    const auth = createAuth(ctx);

    // Find every seeded user still in the DB under the old wrong domain
    const oldUsers = await ctx.runQuery(
      internal.seedHelpers.getSeedUsersByDomain,
      { domain: "@regime.com" },
    );

    // Also check the correct domain in case a partial re-seed ran
    const newUsers = await ctx.runQuery(
      internal.seedHelpers.getSeedUsersByDomain,
      { domain: "@gmail.com" },
    );

    const allSeedUsers = [...oldUsers, ...newUsers];

    if (allSeedUsers.length === 0) {
      console.log("No seed users found — nothing to reset.");
      return { message: "Nothing to reset.", deleted: 0 };
    }

    let deleted = 0;

    for (const user of allSeedUsers) {
      console.log(`Removing seed user: ${user.email}`);

      const password =
        user.role === "supplier" ? "Supplier@123" : "Buyer@123";

      // ── Delete from better-auth ──────────────────────────────────────────
      // Sign in as the user to get a session token, then call deleteUser.
      try {
        const signInResult = await auth.api.signInEmail({
          body: { email: user.email, password },
        });

        // better-auth returns the session token in the sign-in response
        const token =
          (signInResult as unknown as Record<string, unknown>).token as
            | string
            | undefined;

        if (token) {
          const authHeaders = new Headers({
            Authorization: `Bearer ${token}`,
          });
          await auth.api.deleteUser({
            body: { password },
            headers: authHeaders,
          });
          console.log(`  → Deleted better-auth account for ${user.email}`);
        } else {
          console.log(
            `  → No session token returned for ${user.email}; skipping better-auth deletion`,
          );
        }
      } catch (err) {
        // Log but continue — we still clean up the Convex side
        console.log(
          `  → Could not delete better-auth account for ${user.email}:`,
          String(err),
        );
      }

      // ── Delete from Convex (cascade) ─────────────────────────────────────
      await ctx.runMutation(internal.seedHelpers.deleteSeedUser, {
        userId: user._id,
      });

      deleted += 1;
    }

    console.log(`✅ Reset complete. Removed ${deleted} seed users.`);
    return { message: `Reset complete.`, deleted };
  },
});

// ─── Seed Action ─────────────────────────────────────────────────────────────

export const seedDemoData = internalAction({
  args: {},
  handler: async (ctx) => {
    // ── Guard: skip if already seeded ────────────────────────────────────────
    const alreadySeeded = await ctx.runQuery(
      internal.seedHelpers.isAlreadySeeded,
      {},
    );
    if (alreadySeeded) {
      console.log("Demo data already seeded — skipping.");
      return { message: "Demo data already seeded. Skipping." };
    }

    const auth = createAuth(ctx);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // ── Step 1: Create Suppliers ──────────────────────────────────────────────

    const supplierDefs = [
      {
        email: "supplier1@gmail.com",
        name: "GreenMetal Recyclers Ltd",
        phone: "+44 121 555 0101",
        companyName: "GreenMetal Recyclers Ltd",
        taxId: "GB-TAX-SUP-001",
        address: "12 Industrial Estate, Birmingham, B1 1AA, UK",
        warehouseAddress: "Unit 5, Metals Yard, Birmingham, B2 2BB, UK",
        goodsTypes: ["Aluminium", "Copper", "Ferrous Metals"],
        status: "approved" as const,
      },
      {
        email: "supplier2@gmail.com",
        name: "WirePro Industries",
        phone: "+44 161 555 0102",
        companyName: "WirePro Industries",
        taxId: "GB-TAX-SUP-002",
        address: "88 Commerce Road, Manchester, M1 1BB, UK",
        warehouseAddress: undefined,
        goodsTypes: ["Copper Wire", "Cable Scrap", "Electronics"],
        status: "approved" as const,
      },
      {
        email: "supplier3@gmail.com",
        name: "AlloySource Pvt Ltd",
        phone: "+44 114 555 0103",
        companyName: "AlloySource Pvt Ltd",
        taxId: "GB-TAX-SUP-003",
        address: "42 Forge Lane, Sheffield, S1 1CC, UK",
        warehouseAddress: "Warehouse B, Steel Park, Sheffield, S2 2DD, UK",
        goodsTypes: ["Steel", "Stainless Steel", "Plastics"],
        status: "approved" as const,
      },
      {
        email: "supplier4@gmail.com",
        name: "EcoScrap Solutions",
        phone: "+44 113 555 0104",
        companyName: "EcoScrap Solutions",
        taxId: "GB-TAX-SUP-004",
        address: "7 Recycle Way, Leeds, LS1 1DD, UK",
        warehouseAddress: undefined,
        goodsTypes: ["Mixed Metals", "Cardboard", "Paper"],
        status: "pending" as const,
      },
      {
        email: "supplier5@gmail.com",
        name: "Urban Waste Partners",
        phone: "+44 151 555 0105",
        companyName: "Urban Waste Partners",
        taxId: "GB-TAX-SUP-005",
        address: "99 Waste Avenue, Liverpool, L1 1EE, UK",
        warehouseAddress: undefined,
        goodsTypes: ["Urban Waste", "Glass", "Textiles"],
        status: "rejected" as const,
      },
    ];

    const supplierIds: Id<"users">[] = [];

    for (const s of supplierDefs) {
      console.log(`Creating supplier: ${s.email}`);
      const result = await auth.api.signUpEmail({
        body: { email: s.email, password: "Supplier@123", name: s.name },
      });

      const userId: Id<"users"> = await ctx.runMutation(
        internal.users.finalizeRegistration,
        {
          authUserId: result.user.id,
          email: result.user.email,
          role: "supplier",
          name: s.name,
          phone: s.phone,
          companyName: s.companyName,
          taxId: s.taxId,
          address: s.address,
          warehouseAddress: s.warehouseAddress,
          goodsTypes: s.goodsTypes,
        },
      );

      // finalizeRegistration always sets status = "pending"; override as needed
      if (s.status !== "pending") {
        await ctx.runMutation(internal.seedHelpers.patchUserStatus, {
          userId,
          status: s.status,
        });
      }

      supplierIds.push(userId);
    }

    // ── Step 2: Create Buyers ─────────────────────────────────────────────────

    const buyerDefs = [
      {
        email: "buyer1@gmail.com",
        name: "RecycleTech Manufacturing",
        phone: "+44 20 555 0201",
        businessName: "RecycleTech Manufacturing Ltd",
        address: "35 Foundry Street, London, E1 1FF, UK",
        categoriesInterested: ["Aluminium", "Copper", "Steel"],
        status: "approved" as const,
      },
      {
        email: "buyer2@gmail.com",
        name: "PackagePro Industries",
        phone: "+44 24 555 0202",
        businessName: "PackagePro Industries Ltd",
        address: "17 Packaging Park, Coventry, CV1 1GG, UK",
        categoriesInterested: ["Cardboard", "Paper", "Plastics"],
        status: "approved" as const,
      },
      {
        email: "buyer3@gmail.com",
        name: "GreenBuild Corp",
        phone: "+44 116 555 0203",
        businessName: "GreenBuild Corp Ltd",
        address: "55 Construction Ave, Leicester, LE1 1HH, UK",
        categoriesInterested: ["Steel", "Aluminium", "Ferrous Metals"],
        status: "approved" as const,
      },
      {
        email: "buyer4@gmail.com",
        name: "EcoProducts Ltd",
        phone: "+44 115 555 0204",
        businessName: "EcoProducts Ltd",
        address: "8 Green Lane, Nottingham, NG1 1II, UK",
        categoriesInterested: ["Plastics", "Glass", "Textiles"],
        status: "pending" as const,
      },
      {
        email: "buyer5@gmail.com",
        name: "CircularGoods Co",
        phone: "+44 113 555 0205",
        businessName: "CircularGoods Co Ltd",
        address: "22 Circular Road, Bradford, BD1 1JJ, UK",
        categoriesInterested: ["Mixed Metals", "Urban Waste"],
        status: "rejected" as const,
      },
    ];

    const buyerIds: Id<"users">[] = [];

    for (const b of buyerDefs) {
      console.log(`Creating buyer: ${b.email}`);
      const result = await auth.api.signUpEmail({
        body: { email: b.email, password: "Buyer@123", name: b.name },
      });

      const userId: Id<"users"> = await ctx.runMutation(
        internal.users.finalizeRegistration,
        {
          authUserId: result.user.id,
          email: result.user.email,
          role: "buyer",
          name: b.name,
          phone: b.phone,
          businessName: b.businessName,
          address: b.address,
          categoriesInterested: b.categoriesInterested,
        },
      );

      if (b.status !== "pending") {
        await ctx.runMutation(internal.seedHelpers.patchUserStatus, {
          userId,
          status: b.status,
        });
      }

      buyerIds.push(userId);
    }

    // ── Step 3: Upload Lot Images ─────────────────────────────────────────────
    // Using Picsum Photos with fixed seeds → always returns the same image per seed.
    // Two images per lot for a richer gallery experience.

    console.log("Uploading lot images to Convex storage...");

    const [
      aluminiumImg1, aluminiumImg2,
      copperImg1, copperImg2,
      steelImg1, steelImg2,
      cardboardImg1, cardboardImg2,
      plasticImg1, plasticImg2,
      ewasteImg1, ewasteImg2,
    ] = await Promise.all([
      // Lot 1 — Aluminium scrap (draft)
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/greenmetal1/800/600"),
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/greenmetal2/800/600"),
      // Lot 2 — Copper wire (pending_review)
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/wirepro1/800/600"),
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/wirepro2/800/600"),
      // Lot 3 — Steel offcuts (approved)
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/alloy1/800/600"),
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/alloy2/800/600"),
      // Lot 4 — Cardboard bales (assigned)
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/cardboard1/800/600"),
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/cardboard2/800/600"),
      // Lot 5 — Plastic granules (sold)
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/plastic1/800/600"),
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/plastic2/800/600"),
      // Lot 6 — E-waste (expired)
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/ewaste1/800/600"),
      uploadImageFromUrl(ctx, "https://picsum.photos/seed/ewaste2/800/600"),
    ]);

    console.log("All images uploaded.");

    // ── Step 4: Get admin ID (used as assignedByUserId) ───────────────────────

    const adminId = await ctx.runQuery(internal.seedHelpers.getAdminUserId, {});
    if (!adminId) {
      throw new Error(
        "No admin account found. Run the bootstrap action first before seeding demo data.",
      );
    }

    const [s1, s2, s3] = supplierIds; // approved: supplier1, supplier2, supplier3
    const [b1, b2] = buyerIds;        // approved: buyer1, buyer2

    // ── Step 5: Insert Lots — one per status ──────────────────────────────────

    // LOT 1 — DRAFT (supplier1)
    // Supplier has started filling details but hasn't submitted for review yet.
    console.log("Inserting lot 1 (draft)...");
    await ctx.runMutation(internal.seedHelpers.insertLot, {
      supplierUserId: s1,
      title: "Recycled Aluminium Scrap — 5 Tonnes",
      description:
        "High-grade recycled aluminium scrap from manufacturing offcuts. Clean, sorted, and ready for smelting. Ideal for secondary aluminium production. Material has been tested for contamination and composition certificates are available upon request. Stored under cover in a secure yard.",
      category: "Aluminium",
      quantity: 5000,
      unit: "kg",
      imageStorageIds: [aluminiumImg1, aluminiumImg2],
      location: "Birmingham, UK",
      expectedPrice: 4200,
      status: "draft",
      expiresAt: now + 30 * oneDay,
      createdAt: now - 2 * oneDay,
    });

    // LOT 2 — PENDING REVIEW (supplier2)
    // Submitted for admin review; shown in the admin "Pending Lots" queue.
    console.log("Inserting lot 2 (pending_review)...");
    await ctx.runMutation(internal.seedHelpers.insertLot, {
      supplierUserId: s2,
      title: "Industrial Copper Wire — 2 Tonnes",
      description:
        "Surplus copper wire and cable offcuts from a decommissioned factory. Mixed gauges — 1.5 mm to 16 mm — stripped and bundled for easy handling. Purity estimated at 99.1%. Suitable for copper refining, wire drawing, or direct reuse in electrical applications. Collection from site available.",
      category: "Copper Wire",
      quantity: 2000,
      unit: "kg",
      imageStorageIds: [copperImg1, copperImg2],
      location: "Manchester, UK",
      expectedPrice: 12500,
      status: "pending_review",
      expiresAt: now + 45 * oneDay,
      createdAt: now - 5 * oneDay,
    });

    // LOT 3 — APPROVED (supplier3)
    // Admin has approved this lot; it's live and ready to be assigned to buyers.
    console.log("Inserting lot 3 (approved)...");
    await ctx.runMutation(internal.seedHelpers.insertLot, {
      supplierUserId: s3,
      title: "Stainless Steel Offcuts — 8 Tonnes",
      description:
        "Grade 304 stainless steel offcuts from precision CNC engineering. Flat sheet remnants and bar stock in various sizes from 2 mm to 20 mm thickness. All material is clean, rust-free, and verified for composition. Ideal for re-rolling, small fabrication runs, or direct component production. Full material certificates (EN 10204 3.1) available.",
      category: "Steel",
      quantity: 8000,
      unit: "kg",
      imageStorageIds: [steelImg1, steelImg2],
      location: "Sheffield, UK",
      expectedPrice: 9600,
      status: "approved",
      expiresAt: now + 60 * oneDay,
      createdAt: now - 10 * oneDay,
    });

    // LOT 4 — ASSIGNED (supplier1)
    // Admin has assigned this lot to buyer1 and buyer2 for their review.
    console.log("Inserting lot 4 (assigned)...");
    const assignedLotId: Id<"lots"> = await ctx.runMutation(
      internal.seedHelpers.insertLot,
      {
        supplierUserId: s1,
        title: "Corrugated Cardboard Bales — 20 Tonnes",
        description:
          "Large quantity of clean, sorted single-wall corrugated cardboard bales from a major logistics warehouse clearance. Baled to industry-standard dimensions (1200 × 700 × 800 mm). Moisture-free indoor storage. OCC grade, free from food contamination and stretch-film. Suitable for direct recycling or pulp production. Available for immediate collection — FLT access on site.",
        category: "Cardboard",
        quantity: 20000,
        unit: "kg",
        imageStorageIds: [cardboardImg1, cardboardImg2],
        location: "Birmingham, UK",
        expectedPrice: 3800,
        status: "assigned",
        expiresAt: now + 20 * oneDay,
        createdAt: now - 15 * oneDay,
      },
    );

    // LOT 5 — SOLD (supplier2)
    // The transaction is complete; demonstrates the end state for a lot.
    console.log("Inserting lot 5 (sold)...");
    await ctx.runMutation(internal.seedHelpers.insertLot, {
      supplierUserId: s2,
      title: "Mixed Plastic Granules — 3 Tonnes",
      description:
        "Reprocessed mixed plastic granules, predominantly HDPE and PP (approx. 70/30 split). Pre-washed, dried, and granulated to 3–5 mm pellets. MFI tested and within spec for injection moulding or film extrusion. Colour: predominantly natural/grey mix. Suitable for non-food-contact applications. Previously sold and fulfilled.",
      category: "Plastics",
      quantity: 3000,
      unit: "kg",
      imageStorageIds: [plasticImg1, plasticImg2],
      location: "Manchester, UK",
      expectedPrice: 2100,
      status: "sold",
      expiresAt: now - 5 * oneDay,
      createdAt: now - 45 * oneDay,
    });

    // LOT 6 — EXPIRED (supplier3)
    // Listing window passed with no assignment; shows the expired state.
    console.log("Inserting lot 6 (expired)...");
    await ctx.runMutation(internal.seedHelpers.insertLot, {
      supplierUserId: s3,
      title: "Electronic Waste Components — 1 Tonne",
      description:
        "Mixed electronic waste from a corporate office clearance comprising decommissioned desktop PCs, laptops, servers, and peripherals. All units are data-wiped to NIST 800-88 standard with certificates available. Material includes PCBs, CPUs, RAM modules, and HDDs — rich in gold, silver, and palladium for precious metal recovery. Suitable for WEEE-compliant dismantling or component salvage.",
      category: "Electronics",
      quantity: 1000,
      unit: "kg",
      imageStorageIds: [ewasteImg1, ewasteImg2],
      location: "Sheffield, UK",
      expectedPrice: 1500,
      status: "expired",
      expiresAt: now - 15 * oneDay, // listing expired 15 days ago
      createdAt: now - 60 * oneDay,
    });

    // ── Step 6: Insert Assignments ────────────────────────────────────────────

    // buyer1 has responded "interested" → demonstrates a completed buyer interaction
    console.log("Inserting assignment for buyer1 (interested)...");
    await ctx.runMutation(internal.seedHelpers.insertAssignment, {
      lotId: assignedLotId,
      assignedByUserId: adminId,
      assignedToUserId: b1,
      assignedAt: now - 10 * oneDay,
      notes:
        "Priority assignment — this buyer has a strong track record with cardboard bale purchases and an established recycling line. Please respond within 5 working days.",
      responseStatus: "interested",
      responseUpdatedAt: now - 8 * oneDay,
      responseUpdatedByUserId: b1,
    });

    // buyer2 has not yet responded → demonstrates the "pending response" state
    console.log("Inserting assignment for buyer2 (pending)...");
    await ctx.runMutation(internal.seedHelpers.insertAssignment, {
      lotId: assignedLotId,
      assignedByUserId: adminId,
      assignedToUserId: b2,
      assignedAt: now - 9 * oneDay,
      notes:
        "Secondary buyer specialising in packaging materials. Assigned for their consideration alongside the primary buyer.",
      responseStatus: "pending",
    });

    console.log("✅ Demo data seeded successfully.");

    return {
      message: "Demo data seeded successfully!",
      summary: {
        suppliers: supplierDefs.length,
        buyers: buyerDefs.length,
        lots: 6,
        assignments: 2,
      },
    };
  },
});
