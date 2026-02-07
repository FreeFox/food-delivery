import { Box, Container, VStack, Heading, Text, HStack } from '@chakra-ui/react';
import { StarIcon, TimeIcon } from '@chakra-ui/icons';

function HeroBanner({ restaurant }) {
  if (!restaurant) return null;

  return (
    <Box
      bgImage={restaurant.image}
      bgSize="cover"
      bgPos="center"
      h="400px"
      mb={8}
      position="relative"
      _after={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: 'blackAlpha.400'
      }}
    >
      <Container maxW="container.lg" h="full">
        <VStack
          h="full"
          justify="flex-end"
          align="start"
          pb={8}
          position="relative"
          zIndex={1}
        >
          <Heading size="2xl" color="white">
            {restaurant.name}
          </Heading>
          <Text color="white" fontSize="lg">
            {restaurant.cuisine} Cuisine
          </Text>
          <HStack spacing={6} color="white" wrap="wrap">
            <HStack>
              <StarIcon />
              <Text>{restaurant.rating} ({restaurant.reviews} reviews)</Text>
            </HStack>
            <HStack>
              <TimeIcon />
              <Text>{restaurant.deliveryTime}</Text>
            </HStack>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}

export default HeroBanner;
