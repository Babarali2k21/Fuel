import BottomSheetLib, {
  BottomSheetFlatList,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { ReactNode, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

interface BottomSheetProps<T> {
  title: string;
  subtitle?: string;
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => ReactNode;
  keyExtractor: (item: T) => string;
  header?: ReactNode;
}

export function BottomSheet<T>({
  title,
  subtitle,
  data,
  renderItem,
  keyExtractor,
  header,
}: BottomSheetProps<T>) {
  const sheetRef = useRef<BottomSheetLib>(null);
  const snapPoints = useMemo(() => ["28%", "55%", "88%"], []);

  return (
    <BottomSheetLib
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.header}>
        {header}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </BottomSheetView>
      <BottomSheetFlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }) => (
          <View style={styles.itemWrap}>{renderItem({ item, index })}</View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetLib>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  handle: {
    backgroundColor: colors.border,
    width: 44,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    ...typography.headline,
    fontSize: 22,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  itemWrap: {
    backgroundColor: colors.surface,
  },
});
