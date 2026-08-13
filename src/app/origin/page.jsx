"use client";
import React from "react";
import { OriginHero } from "@/components/origin/OriginHero";
import { EstateInfo } from "@/components/origin/EstateInfo";
// import { TeaPickerStories }      from '@/components/origin/TeaPickerStories';
import { PeopleSection } from "@/components/origin/PeopleSection";
import { MapView } from "@/components/origin/MapView";

export default function OriginPage() {
  return (
    <div>
      <OriginHero />
      <div
        style={{
          maxWidth: "var(--max-width-content)",
          margin: "0 auto",
          padding: "var(--spacing-3xl) var(--spacing-lg)",
        }}
      >
        <Section>
          <EstateInfo />
        </Section>
        <Section>
          <PeopleSection />
        </Section>
        <div
          style={{
            width: "100vw",
            maxWidth: "none",
            marginLeft: "calc(50% - 50vw)",
            marginRight: 0,
            paddingLeft: 0,
            paddingRight: 0,
          }}
        >
          <Section
            title="Where we are"
            titleStyle={{
              marginLeft: "25px",
            }}
          >
            <MapView />
          </Section>
        </div>

        {/* <Section title="The people behind the tea">
          <p style={bodyText}>Every leaf is hand-picked by skilled workers — people with years of knowledge about quality, timing, and care. These are the people Chakancha was built to honour.</p>
          <TeaPickerStories />
        </Section> */}
      </div>
    </div>
  );
}

function Section({ title, children, titleStyle = {} }) {
  return (
    <section style={{ marginBottom: "var(--spacing-3xl)" }}>
      {title && (
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--font-size-h2)",
            fontWeight: 600,
            color: "var(--color-earth-brown)",
            margin: "0 0 var(--spacing-xl)",
            ...titleStyle,
          }}
        >
          {title}
        </h2>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-xl)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

const bodyText = {
  fontFamily: "var(--font-sans)",
  fontSize: 16,
  color: "var(--color-text-secondary)",
  lineHeight: 1.7,
  margin: 0,
  maxWidth: 700,
};
