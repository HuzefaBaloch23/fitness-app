import { View, Text } from 'react-native';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { usePalette, space, type } from '../theme';

type Props = {
  points: number[];
  /** Drawn as a dashed ceiling, e.g. the goal weight. */
  targetLine?: number;
  height?: number;
  startLabel?: string;
  endLabel?: string;
};

export function TrendChart({ points, targetLine, height = 150, startLabel, endLabel }: Props) {
  const p = usePalette();

  if (points.length === 0) {
    return (
      <Text style={[type.label, { color: p.textFaint, paddingVertical: space.xl, textAlign: 'center' }]}>
        No data yet
      </Text>
    );
  }

  const W = 320;
  const H = height;
  const pad = 10;

  const values = targetLine != null ? [...points, targetLine] : points;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i: number) =>
    points.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (points.length - 1);
  const y = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2);

  const path = points.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const last = points[points.length - 1];

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {targetLine != null && (
          <Line
            x1={0}
            y1={y(targetLine)}
            x2={W}
            y2={y(targetLine)}
            stroke={p.textFaint}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}
        <Polyline
          points={path}
          fill="none"
          stroke={p.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={x(points.length - 1)} cy={y(last)} r={4} fill={p.accent} />
      </Svg>

      {(startLabel || endLabel) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[type.label, { color: p.textFaint, fontSize: 11 }]}>{startLabel}</Text>
          <Text style={[type.label, { color: p.textFaint, fontSize: 11 }]}>{endLabel}</Text>
        </View>
      )}
    </View>
  );
}
