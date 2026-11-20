import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ReportStatus, ValidationStatus } from '@/types/models';

type Props = {
  type: 'validation' | 'availability' | 'report' | 'role';
  value: ValidationStatus | 'Disponible' | 'Indisponible' | ReportStatus | 'admin' | 'user';
  size?: 'small' | 'medium';
};

export function AdminBadge({ type, value, size = 'small' }: Props) {
  let label = String(value);
  let iconName: keyof typeof MaterialIcons.glyphMap = 'info';
  let bg = '#F1F5F9';
  let text = '#475569';

  if (type === 'validation') {
    switch (value) {
      case 'En attente':
        label = 'En attente';
        iconName = 'hourglass-empty';
        bg = '#FEF3C7';
        text = '#D97706';
        break;
      case 'Vérifié':
        label = 'Vérifié';
        iconName = 'verified';
        bg = '#DCFCE7';
        text = '#16A34A';
        break;
      case 'Contesté':
        label = 'Contesté';
        iconName = 'warning-amber';
        bg = '#FFEDD5';
        text = '#EA580C';
        break;
      case 'Rejeté':
        label = 'Rejeté';
        iconName = 'cancel';
        bg = '#FEE2E2';
        text = '#DC2626';
        break;
    }
  } else if (type === 'availability') {
    if (value === 'Disponible') {
      label = 'Disponible';
      iconName = 'visibility';
      bg = '#DCFCE7';
      text = '#16A34A';
    } else {
      label = 'Masqué';
      iconName = 'visibility-off';
      bg = '#F1F5F9';
      text = '#64748B';
    }
  } else if (type === 'report') {
    switch (value) {
      case 'open':
        label = 'À traiter';
        iconName = 'error-outline';
        bg = '#FEE2E2';
        text = '#DC2626';
        break;
      case 'reviewing':
        label = 'En examen';
        iconName = 'pending';
        bg = '#FEF3C7';
        text = '#D97706';
        break;
      case 'resolved':
        label = 'Résolu';
        iconName = 'check-circle';
        bg = '#DCFCE7';
        text = '#16A34A';
        break;
      case 'dismissed':
        label = 'Sans suite';
        iconName = 'remove-circle-outline';
        bg = '#F1F5F9';
        text = '#64748B';
        break;
    }
  } else if (type === 'role') {
    if (value === 'admin') {
      label = 'Administrateur';
      iconName = 'admin-panel-settings';
      bg = '#EDE9FE';
      text = '#7C3AED';
    } else {
      label = 'Étudiant';
      iconName = 'school';
      bg = '#E0F2FE';
      text = '#0284C7';
    }
  }

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        isSmall ? styles.smallBadge : styles.mediumBadge,
      ]}>
      <MaterialIcons name={iconName} size={isSmall ? 13 : 16} color={text} />
      <Text style={[styles.text, { color: text }, isSmall ? styles.smallText : styles.mediumText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mediumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontWeight: '700',
  },
  smallText: {
    fontSize: 11,
  },
  mediumText: {
    fontSize: 13,
  },
});
