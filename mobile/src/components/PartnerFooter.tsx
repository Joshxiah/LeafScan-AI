/**
 * Footer with the institution logos: WMSU, WMSU ESU Pagadian,
 * WMSU Pagadian BSCS and the City Agriculture Office.
 *
 * A slot falls back to a text badge if its logo is set to null.
 */

import { View, Text, Image, type ImageSourcePropType } from 'react-native';

const WMSU_LOGO: ImageSourcePropType | null = require('../../assets/images/wmsu.png');
const WMSU_ESU_LOGO: ImageSourcePropType | null = require('../../assets/images/wmsu-esu.png');
const CAO_LOGO: ImageSourcePropType | null = require('../../assets/images/cao.png');
const WMSU_BSCS_LOGO: ImageSourcePropType | null = require('../../assets/images/wmsu-bscs.png');

// Names shown in the copyright line under the logos.
const DEVELOPERS = ['Realyn Joy T. Danong', 'Virlyn G. Sandialan', 'Jhoana Marie S. Sumalpong'];

function LogoSlot({
  source,
  fallback,
  label,
}: {
  source: ImageSourcePropType | null;
  fallback: string;
  label: string;
}) {
  return (
    <View className="items-center">
      {source ? (
        <Image source={source} style={{ width: 48, height: 48, borderRadius: 24 }} resizeMode="contain" />
      ) : (
        <View className="h-[48px] w-[48px] items-center justify-center rounded-full border border-[#DFEDE3] bg-white">
          <Text className="text-[11px] font-extrabold text-[#2F6D46]">{fallback}</Text>
        </View>
      )}
    </View>
  );
}

export function PartnerFooter() {
  return (
    <View className="mt-8 items-center border-t border-[#EEF5EF] pt-5">
      <View className="flex-row items-start gap-6">
        <LogoSlot source={WMSU_LOGO} fallback="WMSU" label="Western Mindanao State University" />
        <LogoSlot source={WMSU_ESU_LOGO} fallback="ESU" label="WMSU ESU Pagadian" />
        <LogoSlot source={WMSU_BSCS_LOGO} fallback="BSCS" label="WMSU Pagadian BSCS" />
        <LogoSlot source={CAO_LOGO} fallback="CAO" label="City Agriculture Office" />
      </View>

      <Text className="mt-4 px-4 text-center text-[11px] text-[#7A9483]">
        © {new Date().getFullYear()} LeafScan AI · {DEVELOPERS.slice(0, -1).join(', ')}, and{' '}
        {DEVELOPERS[DEVELOPERS.length - 1]}. All rights reserved.
      </Text>
    </View>
  );
}
