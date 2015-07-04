library facade.intl;

import 'package:intl/intl.dart';

String _normalizeLocale(String locale) => locale.replaceAll('-', '_');

enum NumberFormatStyle {
  DECIMAL,
  PERCENT,
  CURRENCY
}

class NumberFormatter {
  static String format(num number, String locale, NumberFormatStyle style,
      {int minimumIntegerDigits: 1,
      int minimumFractionDigits: 0,
      int maximumFractionDigits: 3,
      String currency,
      bool currencyAsSymbol: false}) {
    locale = _normalizeLocale(locale);
    NumberFormat formatter;
    switch (style) {
      case NumberFormatStyle.DECIMAL:
        formatter = new NumberFormat.decimalPattern(locale);
        break;
      case NumberFormatStyle.PERCENT:
        formatter = new NumberFormat.percentPattern(locale);
        break;
      case NumberFormatStyle.CURRENCY:
        if (currencyAsSymbol) {
          // See https://github.com/dart-lang/intl/issues/59.
          throw new Exception('Displaying currency as symbol is not supported.');
        }
        formatter = new NumberFormat.currencyPattern(locale, currency);
        break;
    }
    formatter.minimumIntegerDigits = minimumIntegerDigits;
    formatter.minimumFractionDigits = minimumFractionDigits;
    formatter.maximumFractionDigits = maximumFractionDigits;
    return formatter.format(number);
  }
}
