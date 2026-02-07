import { Box, Text, HStack, Input, Button, VStack } from '@chakra-ui/react';

export default function CouponsSection({ coupons, couponCode, onCouponCodeChange, onApplyCoupon }) {
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>
        Coupons
      </Text>
      {coupons && coupons.length > 0 ? (
        coupons.map((c) => (
          <HStack key={c.code}>
            <Text>{c.code}</Text>
          </HStack>
        ))
      ) : (
        <Text fontSize="sm">No coupons</Text>
      )}
      <HStack mt={2}>
        <Input
          placeholder="Coupon code"
          value={couponCode}
          onChange={(e) => onCouponCodeChange(e.target.value)}
          size="sm"
        />
        <Button size="sm" onClick={onApplyCoupon}>
          Apply
        </Button>
      </HStack>
    </Box>
  );
}
