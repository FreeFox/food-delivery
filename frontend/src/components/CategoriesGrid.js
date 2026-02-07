import { Box, SimpleGrid, Card, CardBody, VStack, Text, Heading } from '@chakra-ui/react';

function CategoriesGrid({ categories }) {
  return (
    <Box mb={12}>
      <Heading mb={6} size="lg">
        Categories
      </Heading>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        {categories.map((cat) => (
          <Card
            key={cat.id}
            cursor="pointer"
            _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)' }}
            transition="all 0.3s"
            bg="white"
          >
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="3xl">{cat.icon}</Text>
                <Text fontWeight="bold" textAlign="center">
                  {cat.name}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default CategoriesGrid;
