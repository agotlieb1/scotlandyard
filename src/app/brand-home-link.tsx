"use client";

import { Button } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import Image from "next/image";
import NextLink from "next/link";

/**
 * The way back up to the studio, shared by both products. The emblem carries
 * its own disc, so it reads the same on Scotland Yard's paper and on Down4's
 * neon night.
 */
export default function BrandHomeLink({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Button
      component={NextLink}
      href="/"
      variant="text"
      size="small"
      startIcon={
        <Image
          src="/brand/count-mittens-emblem.webp"
          alt=""
          width={24}
          height={24}
        />
      }
      sx={{ alignSelf: "flex-start", ...sx }}
    >
      Count Mittens Games
    </Button>
  );
}
