import { Box, VStack, HStack, Text, IconButton, NumberInput, NumberInputField } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';

export default function CartItems({ items, onUpdateQty, onRemove }) {
  if (!items || items.length === 0) {
    return <Text>No items in cart.</Text>;
  }

  return (
    <VStack align="stretch" spacing={2}>
      {items.map((item) => (
        <Box key={item.productId || item.id} borderWidth="1px" borderRadius="md" p={3}>
          <HStack justify="space-between" align="start">
            <VStack align="start">
              <Text fontWeight="bold">{item.name}</Text>
              <Text fontSize="sm">${item.price}</Text>
            </VStack>
            <VStack>
              <NumberInput
                size="sm"
                maxW="100px"
                value={item.quantity}
                min={0}
                onChange={(v) => onUpdateQty(item, Number(v))}
              >
                <NumberInputField />
              </NumberInput>
              <IconButton
                aria-label="Remove"
                icon={<DeleteIcon />}
                size="sm"
                onClick={() => onRemove(item.productId || item.id)}
              />
            </VStack>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}
