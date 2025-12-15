import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    flexShrink: 1,
  },

  pickerWrap: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'center',
  },

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  timer: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  smallMinutesLabel: {
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },
  smallAdjustButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAdjustText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
  distractionText: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'black',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 12,
  },

  sessionsList: {
    marginTop: 24,
  },
  sessionsTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '800',
  },
  sessionCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  sessionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },

  reportsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  statsContainer: {
    marginTop: 24,
    gap: 12,
  },

  statCard: {
    borderRadius: 20,
    padding: 14,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  statSubLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  chartTitle: {
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
    fontWeight: '900',
  },
  chart: {
    borderRadius: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '800',
  },
  modalYes: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalYesText: {
    color: 'black',
    fontWeight: '900',
  },
  modalNo: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalNoText: {
    fontWeight: '800',
  },

  themeToggle: {
    width: 46,
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  themeToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleIcon: {
    fontSize: 12,
  },
});

export default styles;
